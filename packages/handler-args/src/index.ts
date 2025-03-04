/**
 * This is the default handling of function invocation arguments.
 * You can access the "event" object via "context.invocationArgs" anywhere in your code.
 */
import { ContextPlugin } from "@webiny/handler";
import { ArgsContext } from "~/types";

export default (): ContextPlugin<ArgsContext> => {
    return new ContextPlugin(async context => {
        const [event] = context.args;
        context.invocationArgs = event;
    });
};
