import { ChartLineUp, Database, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

type WorkspacePlaceholderProps = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
}>;

const starterCards = [
  {
    title: "Dashboard",
    description: "Dùng Card, Tabs, Select, DataTable và Chart để dựng trang tổng quan.",
    icon: ChartLineUp,
  },
  {
    title: "Dữ liệu",
    description: "Tách mock data theo feature, sau này thay bằng API/query layer.",
    icon: Database,
  },
  {
    title: "Phân quyền",
    description: "Giữ route theo role, UI permission theo config và server guard về sau.",
    icon: ShieldCheck,
  },
];

export function WorkspacePlaceholder({ eyebrow, title, description }: WorkspacePlaceholderProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="border-border rounded-2xl border bg-white p-6 shadow-sm">
        <Badge tone="brand">{eyebrow}</Badge>
        <h1 className="text-foreground mt-4 text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6">{description}</p>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        {starterCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title}>
              <CardHeader>
                <span className="bg-brand-muted text-brand grid size-11 place-items-center rounded-xl">
                  <Icon size={22} />
                </span>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted h-2 rounded-full">
                  <div className="bg-brand h-full w-2/3 rounded-full" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
