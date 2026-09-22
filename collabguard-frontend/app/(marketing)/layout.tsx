import { MarketingNav } from "@/components/nav/MarketingNav"
import { MarketingFooter } from "@/components/nav/MarketingFooter"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <MarketingNav />
      <main className="pt-16">
        {children}
      </main>
      <MarketingFooter />
    </>
  )
}
