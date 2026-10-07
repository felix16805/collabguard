"""AST-based normalization and tokenization for Python source code."""
import ast
import io
import tokenize
from dataclasses import dataclass
from typing import List, Optional, Tuple


@dataclass
class CodeToken:
    type_name: str
    normalized_value: str
    lineno: int
    col_offset: int
    end_lineno: int
    end_col_offset: int


class ASTNormalizer(ast.NodeTransformer):
    """
    Transforms Python AST to normalize identifiers, constants, and function calls
    so that trivial renaming (e.g., student changing 'result' to 'res') does not evade detection.
    """

    def __init__(self):
        super().__init__()
        self.var_map = {}
        self.func_map = {}
        self.var_counter = 0
        self.func_counter = 0

    def visit_FunctionDef(self, node: ast.FunctionDef) -> ast.AST:
        # Strip docstring
        if (
            node.body
            and isinstance(node.body[0], ast.Expr)
            and isinstance(node.body[0].value, ast.Constant)
            and isinstance(node.body[0].value.value, str)
        ):
            node.body.pop(0)

        # Normalize function name if not a standard dunder
        if not (node.name.startswith("__") and node.name.endswith("__")):
            if node.name not in self.func_map:
                self.func_counter += 1
                self.func_map[node.name] = f"FUNC_{self.func_counter}"
            node.name = self.func_map[node.name]

        return self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> ast.AST:
        return self.visit_FunctionDef(node)  # type: ignore

    def visit_Name(self, node: ast.Name) -> ast.AST:
        # Standard built-ins are kept; user variables are normalized
        builtins = {
            "print", "len", "range", "int", "str", "float", "list", "dict",
            "set", "tuple", "bool", "min", "max", "sum", "sorted", "enumerate",
            "zip", "open", "type", "isinstance", "True", "False", "None"
        }
        if node.id not in builtins and not node.id.startswith("__"):
            if node.id in self.func_map:
                node.id = self.func_map[node.id]
            else:
                if node.id not in self.var_map:
                    self.var_counter += 1
                    self.var_map[node.id] = f"VAR_{self.var_counter}"
                node.id = self.var_map[node.id]
        return self.generic_visit(node)


def tokenize_python_code(source_code: str) -> List[CodeToken]:
    """
    Parse Python code into AST, normalize identifiers, and extract token stream
    with precise source line and column coordinates.
    """
    tokens: List[CodeToken] = []

    # Attempt 1: Full AST Parse + Normalization
    try:
        tree = ast.parse(source_code)
        normalizer = ASTNormalizer()
        tree = normalizer.visit(tree)
        ast.fix_missing_locations(tree)

        # Walk AST nodes in order
        for node in ast.walk(tree):
            node_type = type(node).__name__
            lineno = getattr(node, "lineno", 1)
            col_offset = getattr(node, "col_offset", 0)
            end_lineno = getattr(node, "end_lineno", lineno)
            end_col_offset = getattr(node, "end_col_offset", col_offset + 1)

            val = node_type
            if isinstance(node, ast.Name):
                val = f"ID:{node.id}"
            elif isinstance(node, ast.Constant):
                val = f"CONST:{type(node.value).__name__}"
            elif isinstance(node, (ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Mod, ast.Pow)):
                val = f"OP:{node_type}"
            elif isinstance(node, (ast.Eq, ast.NotEq, ast.Lt, ast.LtE, ast.Gt, ast.GtE)):
                val = f"CMP:{node_type}"

            tokens.append(
                CodeToken(
                    type_name=node_type,
                    normalized_value=val,
                    lineno=lineno,
                    col_offset=col_offset,
                    end_lineno=end_lineno,
                    end_col_offset=end_col_offset,
                )
            )

        if len(tokens) >= 5:
            return tokens

    except SyntaxError:
        pass  # Fall through to fallback tokenizer

    # Attempt 2: Fallback Lexical Tokenizer (handles invalid syntax or incomplete scripts)
    try:
        token_generator = tokenize.generate_tokens(io.StringIO(source_code).readline)
        var_counter = 0
        var_map = {}

        for tok_type, tok_string, (sline, scol), (eline, ecol), _ in token_generator:
            if tok_type in (tokenize.COMMENT, tokenize.NL, tokenize.NEWLINE, tokenize.INDENT, tokenize.DEDENT):
                continue
            name = tokenize.tok_name[tok_type]
            norm_val = tok_string

            if tok_type == tokenize.NAME:
                if tok_string not in var_map:
                    var_counter += 1
                    var_map[tok_string] = f"V{var_counter}"
                norm_val = var_map[tok_string]
            elif tok_type in (tokenize.NUMBER, tokenize.STRING):
                norm_val = "LITERAL"

            tokens.append(
                CodeToken(
                    type_name=name,
                    normalized_value=norm_val,
                    lineno=sline,
                    col_offset=scol,
                    end_lineno=eline,
                    end_col_offset=ecol,
                )
            )
    except Exception:
        pass

    return tokens
