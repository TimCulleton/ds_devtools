import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { EventEmitter } from "events";
import { ProcessErrorMessage, replace } from "../resources/messages";

export type ProcessCallback = (data?: string) => void;

export interface IProcessWrapper {

    childProcess: ChildProcessWithoutNullStreams | undefined;

    isAlive: boolean;

    command: string;

    onData(callback: ProcessCallback): () => void;

    onError(callback: ProcessCallback): () => void;

    onExit(callback: ProcessCallback): () => void;

    writeToProcess(data: string): this;

    killProcess(): void;

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
        }

        return this;
    }

    private _addEventListener<T extends ProcessWrapperEvent>(event: T, callbackFn: ProcessCallback): () => void {
        this._emitter.on(event, callbackFn);
        return this._creatDiscconectFn(event, callbackFn);
    }

    private _creatDiscconectFn<T extends ProcessWrapperEvent>(event: T, callbackFn: ProcessCallback): () => void {
        return () => {
            this._emitter.off(event, callbackFn);
        };
    }
}
