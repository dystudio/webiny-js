import { createSettingsCrud } from "./settings.crud";
import { createSystemCrud } from "./system.crud";
import { CmsContext, HeadlessCmsStorageOperations } from "~/types";
import { ContextPlugin } from "@webiny/handler";
import { createModelGroupsCrud } from "~/content/plugins/crud/contentModelGroup.crud";
import { createModelsCrud } from "~/content/plugins/crud/contentModel.crud";
import { createContentEntryCrud } from "~/content/plugins/crud/contentEntry.crud";

const debug = process.env.DEBUG === "true";

export interface CreateAdminCrudsParams {
    storageOperations: HeadlessCmsStorageOperations;
}

export const createAdminCruds = (params: CreateAdminCrudsParams) => {
    const { storageOperations } = params;
    return new ContextPlugin<CmsContext>(async context => {
        if (context.http?.request?.method === "OPTIONS") {
            return;
        }

        /**
         * This should never happen in the actual project.
         * It is to make sure that we load setup context before the CRUD init in our internal code.
         */
        if (!context.cms) {
            debug &&
                console.log(
                    `Missing initial "cms" on the context. Make sure that you set it up before creating Admin CRUDs.`
                );
            return;
        }
        const getLocale = () => {
            return context.cms.getLocale();
        };

        const getIdentity = () => {
            return context.security.getIdentity();
        };

        const getTenant = () => {
            return context.tenancy.getCurrentTenant();
        };

        if (storageOperations.plugins && storageOperations.plugins.length > 0) {
            context.plugins.register(storageOperations.plugins);
        }

        context.cms = {
            ...context.cms,
            storageOperations,
            ...createSystemCrud({
                context,
                getTenant,
                getIdentity,
                storageOperations
            }),
            ...createSettingsCrud({
                context,
                getTenant,
                getLocale,
                storageOperations
            }),
            ...createModelGroupsCrud({
                context,
                getTenant,
                getLocale,
                getIdentity,
                storageOperations
            }),
            ...createModelsCrud({
                context,
                getTenant,
                getLocale,
                getIdentity,
                storageOperations
            }),
            ...createContentEntryCrud({
                context,
                getIdentity,
                storageOperations
            })
        };

        if (!storageOperations.init) {
            return;
        }
        await storageOperations.init(context.cms);
    });
};
