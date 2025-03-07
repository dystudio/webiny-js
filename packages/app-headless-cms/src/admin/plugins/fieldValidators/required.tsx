import { CmsEditorFieldValidatorPlugin } from "~/types";

const plugin: CmsEditorFieldValidatorPlugin = {
    type: "cms-editor-field-validator",
    name: "cms-editor-field-validator-required",
    validator: {
        name: "required",
        label: "Required",
        description: "You won't be able to submit the form if this field is empty",
        defaultMessage: "Value is required."
    }
};
export default plugin;
