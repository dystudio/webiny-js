import "cypress-wait-until";
import { addMatchImageSnapshotCommand } from "cypress-image-snapshot/command";
import "./login";
import "./dropFile";
import "./reloadUntil";
import "./pageBuilder/pbListPages";
import "./pageBuilder/pbCreatePage";
import "./pageBuilder/pbUpdatePage";
import "./pageBuilder/pbPublishPage";
import "./pageBuilder/pbDeletePage";
import "./pageBuilder/pbCreateMenu";
import "./pageBuilder/pbDeleteMenu";
import "./pageBuilder/pbCreateCategory";
import "./pageBuilder/pbDeleteCategory";
import "./headlessCms/cmsCreateContentModel";
import "./headlessCms/cmsUpdateContentModel";
import "./headlessCms/cmsDeleteContentModel";
import "./headlessCms/cmsListContentModelGroup";
import "./headlessCms/cmsCreateContentModelGroup";
import "./headlessCms/cmsDeleteContentModelGroup";
import "./headlessCms/cmsListBooks";
import "./security/securityCreateUser";
import "./security/securityDeleteUser";
import "./security/securityReadGroup";
import "./security/securityCreateGroup";
import "./security/securityDeleteGroup";
import "./security/securityReadApiKey";
import "./security/securityCreateApiKey";
import "./security/securityDeleteApiKey";
import "./fileManager/fmListFiles";
import "./fileManager/fmDeleteFile";
import "./fileManager/fmListTags";

Cypress.Commands.overwrite("visit", (orig, url, options) => {
    return orig(url, { ...options, failOnStatusCode: false });
});

addMatchImageSnapshotCommand();
