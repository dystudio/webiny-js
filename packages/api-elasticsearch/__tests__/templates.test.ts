import { base } from "~/indexConfiguration/base";
import { japanese } from "~/indexConfiguration/japanese";
import { ElasticsearchIndexRequestBody } from "~/types";
import {
    createElasticsearchClient,
    deleteAllIndices,
    putTemplate,
    getTemplate,
    deleteAllTemplates
} from "./helpers";

/**
 * Add configurations when added to the code.
 */
const settings: [string, ElasticsearchIndexRequestBody][] = [
    ["base", base],
    ["japanese", japanese]
];

const order = 75;

const createIndexPattern = (name: string): string => {
    return `test-index-${name}-*`;
};

describe("Elasticsearch Templates", () => {
    const client = createElasticsearchClient();

    beforeEach(async () => {
        await deleteAllIndices(client);
        await deleteAllTemplates(client);
    });

    afterEach(async () => {
        await deleteAllIndices(client);
        await deleteAllTemplates(client);
    });

    it.each(settings)(
        "should create template with correct settings - %s",
        // @ts-ignore
        async (name: string, setting: ElasticsearchIndexRequestBody) => {
            /**
             * First we need to create the template.
             */
            const templateName = `template-${name}`;
            const index_patterns: string[] = [createIndexPattern(name)];

            const createResponse = await putTemplate(client, {
                name: templateName,
                order,
                body: {
                    index_patterns,
                    aliases: {},
                    ...setting
                }
            });
            /**
             * ... verify that everything is ok.
             */
            expect(createResponse).toMatchObject({
                body: {
                    acknowledged: true
                },
                statusCode: 200
            });

            const response = await getTemplate(client);

            expect(response).toMatchObject({
                body: {
                    [templateName]: {
                        ...setting,
                        order,
                        aliases: {},
                        index_patterns
                    }
                },
                statusCode: 200
            });

            expect(response.body[templateName]).toEqual({
                ...setting,
                order,
                aliases: {},
                index_patterns
            });

            const testIndexName = `test-index-${name}-locale-code`;
            /**
             * Then create the index with given pattern...
             */
            const createIndexResponse = await client.indices.create({
                index: testIndexName
            });
            expect(createIndexResponse).toMatchObject({
                body: {
                    acknowledged: true,
                    index: testIndexName
                },
                statusCode: 200
            });
            /**
             * And finally verify that index has correct configuration
             */
            const mappings = await client.indices.getMapping({
                index: testIndexName
            });
            expect(mappings.body[testIndexName].mappings).toEqual({
                ...setting.mappings
            });

            const settings = await client.indices.getSettings({
                index: testIndexName
            });
            expect(settings.body[testIndexName].settings).toEqual({
                ...setting.settings,
                index: {
                    ...setting.settings.index,
                    creation_date: expect.stringMatching(/^([0-9]+)$/),
                    number_of_replicas: expect.stringMatching(/^([0-9]+)$/),
                    number_of_shards: expect.stringMatching(/^([0-9]+)$/),
                    provided_name: testIndexName,
                    uuid: expect.stringMatching(/^([a-zA-Z0-9_-]+)$/),
                    version: {
                        created: expect.stringMatching(/^([0-9]+)$/)
                    }
                }
            });
        }
    );
});