import App from "@/components/features/ManusOriginal";

export function generateStaticParams() {
  return [
    { slug: [] }, // /
    { slug: ["about"] },
    { slug: ["components"] },
    { slug: ["resources"] },
    { slug: ["architecture"] },
  ];
}

export default function Page() {
  return <App />;
}
