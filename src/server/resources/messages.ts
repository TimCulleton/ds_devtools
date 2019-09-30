// tslint:disable: max-line-length

export enum ProcessErrorMessage {
    CAN_NOT_CREATE_NEW_PROCESS_ORIGINAL_STILL_RUNNING =
        "Can not create new process {command} as original process {originalCommand} still running.",
    CAN_NOT_WRITE_TO_PROCESS_DOES_NOT_EXIST =
        "Can not write to process as it has not been created",
}

export enum ProcessDebugMessage {
    CREATING_PROCESS = "Creating process: {command}",
    PROCESS_CREATED = "Process {command} has been created",
    KILLING_PROCESS = "Killing process: {command}",
}

export interface IProcessCanNotCreateNewProcessOriginalStillRunningData {
    command: string;
    originalCommand: string;
}

export interface ISimpleProcessCommandData {
    command: string;
}

export type ValueType<T> =
    T extends ProcessErrorMessage.CAN_NOT_CREATE_NEW_PROCESS_ORIGINAL_STILL_RUNNING ? IProcessCanNotCreateNewProcessOriginalStillRunningData :
    T extends ProcessDebugMessage.CREATING_PROCESS ? ISimpleProcessCommandData :
    T extends ProcessDebugMessage.PROCESS_CREATED ? ISimpleProcessCommandData :
    T extends ProcessDebugMessage.KILLING_PROCESS ? ISimpleProcessCommandData :
    T extends string ? "object" : "undefined";

/**
 *
 * For the supplied message replace any values in the '{}' with values from the supplied values object.
 * @export
 * @template T extends string: typically this will be a defined message which will set the valueType
 * @param {T} message - Message that has properties to be replaced
 * @param {ValueType<T>} values - Object which contains values that will be inserted into the messag
 * @returns {string}
 */
export function replace<T extends string>(message: T, values: ValueType<T>): string {
    return message.replace(/\{([\w\-]+)\}/g, (m, name) => {
        return values[name] !== undefined ? values[name] : m;
    });
}
