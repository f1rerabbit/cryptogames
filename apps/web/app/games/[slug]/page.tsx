import { Page, Shell } from "@cg/ui";
import { DemoWager } from "../../client-actions";
import { LiveGameDetail } from "../../live-data";
export default async function Detail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Shell>
      <Page eyebrow="SERVER-AUTHORITATIVE DEMO" title="Demo game">
        <LiveGameDetail slug={slug}>
          <h2>Demo launch</h2>
          <DemoWager slug={slug} />
        </LiveGameDetail>
      </Page>
    </Shell>
  );
}
