import { FlushHookPlugin } from "@webiny/api-prerendering-service/flush/types";
import CloudFront from "aws-sdk/clients/cloudfront";
import url from "url";
import { Args, Configuration } from "~/types";

interface AfterFlushParams {
    log: (...args: string[]) => void;
    render: {
        args: Args;
        configuration: Configuration;
    };
}

// This plugin will issue a cache invalidation request to CloudFront, every time a page has been deleted. This is
// mostly important when a user unpublishes a new page, and we want to make the page immediately publicly available.
export default () => {
    return {
        type: "ps-flush-hook",
        afterFlush: async ({ log, render }: AfterFlushParams) => {
            if (!render) {
                log("Skipping afterFlush because no render was provided.");
                return;
            }

            const { args, configuration } = render;
            // Let's create a cache invalidation request.
            log("Trying to send a CloudFront cache invalidation request...");

            let distributionId = args?.configuration?.meta?.cloudfront?.distributionId;
            if (!distributionId) {
                distributionId = configuration?.meta?.cloudfront?.distributionId;
            }

            if (!distributionId) {
                log(`Exiting... CloudFront "distributionId" not provided.`);
                return;
            }

            log("Trying to get the path that needs to be invalidated...");
            let path: string | undefined = args.path;
            if (!path) {
                log(`Path wasn't passed via "args.path", trying to extract it from "args.url"...`);
                const parsed = url.parse(args.url as string);
                if (parsed && parsed.pathname) {
                    path = parsed.pathname;
                }
            }

            if (!path) {
                log(`Aborting the cache invalidation attempt... "path" not detected.`);
                return;
            }

            path += "*";

            log(
                `Proceeding with issuing a cache invalidation request to CloudFront distribution "${distributionId}", path "${path}".`
            );

            const cloudfront = new CloudFront();
            try {
                await cloudfront
                    .createInvalidation({
                        DistributionId: distributionId,
                        InvalidationBatch: {
                            CallerReference: `${new Date().getTime()}-api-prerender-service-aws-after-flush`,
                            Paths: {
                                Quantity: 1,
                                Items: [path]
                            }
                        }
                    })
                    .promise();
            } catch (e) {
                // eslint-disable-next-line
                console.log(
                    `Failed to issue a cache invalidation request to CloudFront distribution "${distributionId}".`,
                    e.stack
                );
            }

            console.log(`Cache invalidation request (path "${path}") successfully issued.`);
        }
    } as FlushHookPlugin;
};
