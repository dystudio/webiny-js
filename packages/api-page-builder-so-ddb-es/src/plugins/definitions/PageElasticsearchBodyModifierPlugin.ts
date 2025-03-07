import { ElasticsearchBodyModifierPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchBodyModifierPlugin";

export class PageElasticsearchBodyModifierPlugin extends ElasticsearchBodyModifierPlugin {
    public static override readonly type: string = "pageBuilder.elasticsearch.modifier.body.page";
}
