import { ChildProcessWithoutNullStreams } from "child_process";
import { platform } from "os";
import { IProcessWrapper, ProcessCallback, ProcessWrapper } from "./processUtils";

/**
 *
 * Simple Class that will automatically initalize the underlying process
 * to the cmd/bash depending on the invoking environment.
 * @export
 * @class CommandProcess
 * @implements {IProcessWrapper}
 */
export class CommandProcess implements IProcessWrapper {
    private _processWrapper: IProcessWrapper;

    constructor(processWrapper?: IProcessWrapper) {
        this._processWrapper = processWrapper || new ProcessWrapper();
        const platformId = platform();
        let command = "";

        // only support windows/linux
        if (platformId === "win32") {
            command = "cmd";
        } else if (platformId === "linux") {
            command = "bash";
        }

        this._processWrapper.createChildProcess(command);
    }

    public get childProcess(): ChildProcessWithoutNullStreams | undefined {
        return this._processWrapper.childProcess;
    }

    public get isAlive(): boolean {
        return this._processWrapper.isAlive;
    }

    public get command(): string {
        return this._processWrapper.command;
    }

    public onData(callback: ProcessCallback): () => void {
        return this._processWrapper.onData(callback);
    }

    public onError(callback: ProcessCallback): () => void {
        return this._processWrapper.onError(callback);
    }

    public onExit(callback: ProcessCallback): () => void {
        return this._processWrapper.onExit(callback);
    }

    public writeToProcess(data: string): this {
        this._processWrapper.writeToProcess(data);
        return this;
    }

    public killProcess(): void {
        this._processWrapper.killProcess();
    }

    public createChildProcess(command: string): this {
        // do nothing
        return this;
    }
}
