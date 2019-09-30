import { platform } from "os";
import { ProcessWrapper } from "../../../src/server/processUtils/processUtils";

describe(`Process Utils tests`, () => {

    let processWrapper: ProcessWrapper;

    beforeEach(() => {
        processWrapper = new ProcessWrapper();
    });

    it(`Create CMD/Bash process`, done => {
        processWrapper.onExit(() => {
            done();
        });

        expect(processWrapper.childProcess).toBeFalsy();
        expect(processWrapper.isAlive).toBeFalsy();
        expect(processWrapper.command).toBeFalsy();

        const command = Helper.getCommandForPlatform();
        processWrapper.createChildProcess(command);
        expect(processWrapper.childProcess).toBeTruthy();
        expect(processWrapper.isAlive).toBeTruthy();
        expect(processWrapper.command).toBe(command);

        processWrapper.killProcess();
    });

    /**
     * Create a cmd/bash command and invoke the ls command
     */
    it(`Write command to CMD/Bash process`, done => {
        processWrapper.onExit(() => {
            done();
        });

        const command = Helper.getCommandForPlatform();
        processWrapper.createChildProcess(command);

        processWrapper.onData(lsContent => {
            expect(lsContent).toBeTruthy();
            console.log(lsContent);
        });

        processWrapper.writeToProcess("ls");
        processWrapper.killProcess();
    });
});

// tslint:disable-next-line: no-namespace
namespace Helper {

    export function getCommandForPlatform(): string {
        let command = "";

        const platformId = platform();
        // only support windows/linux
        if (platformId === "win32") {
            command = "cmd";
        } else if (platformId === "linux") {
            command = "bash";
        }

        return command;
    }
}
