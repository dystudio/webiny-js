import prettier from "prettier";
import contentModels from "./mocks/contentModels";
import graphQLFieldPlugins from "~/content/plugins/graphqlFields";
import { createManageSDL } from "~/content/plugins/schema/createManageSDL";
import categoryManage from "./snapshots/category.manage";
import productManage from "./snapshots/product.manage";
import reviewManage from "./snapshots/review.manage";

describe("MANAGE - ContentModel to SDL", () => {
    const fieldTypePlugins = graphQLFieldPlugins().reduce((acc, pl) => {
        acc[pl.fieldType] = pl;
        return acc;
    }, {});

    test("Category SDL", async () => {
        const model = contentModels.find(c => c.modelId === "category");
        const sdl = createManageSDL({ model, fieldTypePlugins });
        const prettyGql = prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = prettier.format(categoryManage.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });

    test("Product SDL", async () => {
        const model = contentModels.find(c => c.modelId === "product");
        const sdl = createManageSDL({ model, fieldTypePlugins });
        const prettyGql = prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = prettier.format(productManage.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });

    test("Review SDL", async () => {
        const model = contentModels.find(c => c.modelId === "review");
        const sdl = createManageSDL({ model, fieldTypePlugins });
        const prettyGql = prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = prettier.format(reviewManage.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });
});
