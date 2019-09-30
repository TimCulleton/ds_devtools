import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { EventEmitter } from "events";
import { ProcessDebugMessage, ProcessErrorMessage, replace } from "../resources/messages";
import * as Trace from "../utils/trace";

export type ProcessCallback = (data?: string) => void;

export interface IProcessWrapper {

    /**
     * Underlying Node Process
     * @type {(ChildProcessWithoutNullStreams | undefined)}
     * @memberof IProcessWrapper
     */
    childProcess: ChildProcessWithoutNullStreams | undefined;

    /**
     * Is the current process alive
     * @type {boolean}
     * @memberof IProcessWrapper
     */
    isAlive: boolean;

    /**
     * Command used to start the process.
     * Generally this will be a cmd or bash depending
     * on the invoking environment
     * @type {string}
     * @memberof IProcessWrapper
     */
    command: string;

    /**
     * Supply a callback function which will be invoked
     * whenever the process recieves data from the process.
     * @param {ProcessCallback} callback
     * @returns {() => void} - Unsubscribe function
     * @memberof IProcessWrapper
     */
    onData(callback: ProcessCallback): () => void;

    /**
     * supplly callback functon which will be invoked
     * whenever the process sends an error
     * @param {ProcessCallback} callback
     * @returns {() => void} - Unsubscribe function
     * @memberof IProcessWrapper
     */
    onError(callback: ProcessCallback): () => void;

    /**
     * Supply a callback function which will be invoked
     * when the process has quit
     * @param {ProcessCallback} callback
     * @returns {() => void} - Unsubscribe function
     * @memberof IProcessWrapper
     */
    onExit(callback: ProcessCallback): () => void;

    /**
     * Write data to the process.
     * Typically this will be a command which will be invoked
     * by the process. EG 'ls' to the bash/cmd to list dir contents
     * or more specific 'mkmk' commands
     * @param {string} data
     * @returns {this}
     * @memberof IProcessWrapper
     */
    writeToProcess(data: string): this;

    /**
     * Terminate the current process
     * @memberof IProcessWrapper
     */
    killProcess(): void;

    /**
     * create a new child process which will be invoked
     * with the supplied command.
     * Typically this will be cmd or bash depending on the
     * environment
     * @param {string} command
     * @returns {this}
     * @memberof IProcessWrapper
     */
    createChildProcess(command: string): this;
}

enum ProcessWrapperEvent {
    Data = "data",
    Error = "error",
    Exit = "exit",
}

export class ProcessWrapper implements IProcessWrapper {

    private _childProcess: ChildProcessWithoutNullStreams | undefined;
    private _command: string;
    private _emitter: EventEmitter;

    constructor() {
        this._childProcess = undefined;
        this._command = "";
        this._emitter = new EventEmitter();
    }

    get childProcess(): ChildProcessWithoutNullStreams | undefined {
        return this._childProcess;
    }

    get isAlive(): boolean {
        return !!this.childProcess;
    }

    get command(): string {
        return this._command;
    }

    public onData(callback: ProcessCallback): () => void {
        return this._addEventListener(ProcessWrapperEvent.Data, callback);
    }

    public onError(callback: ProcessCallback): () => void {
        return this._addEventListener(ProcessWrapperEvent.Error, callback);
    }

    public onExit(callback: ProcessCallback): () => void {
        return this._addEventListener(ProcessWrapperEvent.Exit, callback);
    }

    public writeToProcess(data: string): this {
        if (this.childProcess) {
            this.childProcess.stdin.write(data + `\n`);
        } else {
            throw new Error(ProcessErrorMessage.CAN_NOT_WRITE_TO_PROCESS_DOES_NOT_EXIST);
        }

        return this;
    }

    public killProcess(): void {
        if (this.childProcess) {
            Trace.debug(replace(ProcessDebugMessage.KILLING_PROCESS, {command: this.command}));
            this.childProcess.stdin.end();
        }
    }

    public createChildProcess(command: string): this {
        if (this.childProcess) {
            const errorMessage = replace(ProcessErrorMessage.CAN_NOT_CREATE_NEW_PROCESS_ORIGINAL_STILL_RUNNING, {
                command,
                originalCommand: this.command,
            });
            throw new Error(errorMessage);

        } else {
            this._command = command;
            this._childProcess = spawn(command);

            Trace.debug(replace(ProcessDebugMessage.CREATING_PROCESS, {command}));

            // link emmitters
            // NOTE - Data is coming in as a buffer
            this._childProcess.stdout.on("data", (data: string | Buffer) => {
                const stringData = typeof data === "string"
                    ? data
                    : data.toString();
                this._emitter.emit(ProcessWrapperEvent.Data, stringData);
            });

            this._childProcess.stderr.on("data", (data: string | Buffer) => {
                this._emitter.emit(ProcessWrapperEvent.Error, data);
            });

            this._childProcess.on("exit", data => {
                this._emitter.emit(ProcessWrapperEvent.Exit, data);

                // Clean up
                if (this._childProcess) {
                    this._childProcess.stdout.removeAllListeners();
                    this._childProcess.stderr.removeAllListeners();
                    this._childProcess.removeAllListeners();
                    this._childProcess = undefined;
                }
            });

            Trace.debug(replace(ProcessDebugMessage.PROCESS_CREATED, {command}));
        }

        return this;
    }

    /**
     * Helper function to add event listener to the specified event
     * @private
     * @template T - String mapping to the ProcessWrapperEvent
     * @param {T} event - Event ID
     * @param {ProcessCallback} callbackFn
     * @returns {() => void} - Return a generic unsubscribe/dissconect function
     * @memberof ProcessWrapper
     */
    private _addEventListener<T extends ProcessWrapperEvent>(event: T, callbackFn: ProcessCallback): () => void {
        this._emitter.on(event, callbackFn);
        return this._creatDiscconectFn(event, callbackFn);
    }

    /**
     * Helper function to create a discconect function for the eventEmitter 'off'
     * @private
     * @template T
     * @param {T} event
     * @param {ProcessCallback} callbackFn
     * @returns {() => void}
     * @memberof ProcessWrapper
     */
    private _creatDiscconectFn<T extends ProcessWrapperEvent>(event: T, callbackFn: ProcessCallback): () => void {
        return () => {
            this._emitter.off(event, callbackFn);
        };
    }
}
