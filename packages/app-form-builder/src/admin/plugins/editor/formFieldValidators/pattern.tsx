import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { plugins } from "@webiny/plugins";
import { validation } from "@webiny/validation";
import {
    FbBuilderFormFieldPatternValidatorPlugin,
    FbBuilderFormFieldValidatorPlugin
} from "~/types";

const plugin: FbBuilderFormFieldValidatorPlugin = {
    type: "form-editor-field-validator",
    name: "form-editor-field-validator-pattern",
    validator: {
        name: "pattern",
        label: "Pattern",
        description: "Entered value must match a specific pattern.",
        defaultMessage: "Invalid value.",
        // TODO @ts-refactor verify that settings is being used - there is no type written for it
        // @ts-ignore
        defaultSettings: {
            preset: "custom"
        },
        renderSettings({ Bind, setValue, setMessage, data }) {
            const inputsDisabled = data.settings.preset !== "custom";
            const presetPlugins = plugins.byType<FbBuilderFormFieldPatternValidatorPlugin>(
                "form-editor-field-validator-pattern"
            );

            const selectOptions: any = presetPlugins.map(item => (
                <option key={item.pattern.name} value={item.pattern.name}>
                    {item.pattern.label}
                </option>
            ));

            return (
                <Grid>
                    <Cell span={3}>
                        <Bind
                            name={"settings.preset"}
                            validators={validation.create("required")}
                            afterChange={value => {
                                if (value === "custom") {
                                    setMessage("Invalid value.");
                                    return;
                                }

                                setValue("settings.regex", null);
                                setValue("settings.flags", null);

                                const selectedPatternPlugin = presetPlugins.find(
                                    item => item.pattern.name === value
                                );
                                if (!selectedPatternPlugin) {
                                    return;
                                }

                                setMessage(selectedPatternPlugin.pattern.message);
                            }}
                        >
                            <Select label={"Preset"}>
                                <option value={"custom"}>Custom</option>
                                {selectOptions}
                            </Select>
                        </Bind>
                    </Cell>
                    <Cell span={7}>
                        <Bind name={"settings.regex"} validators={validation.create("required")}>
                            <Input
                                disabled={inputsDisabled}
                                label={"Regex"}
                                description={"Regex to test the value"}
                            />
                        </Bind>
                    </Cell>
                    <Cell span={2}>
                        <Bind name={"settings.flags"} validators={validation.create("required")}>
                            <Input
                                disabled={inputsDisabled}
                                label={"Flags"}
                                description={"Regex flags"}
                            />
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};
export default plugin;
