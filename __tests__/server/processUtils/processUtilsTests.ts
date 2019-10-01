import { platform } from "os";
import { ProcessWrapper } from "../../../src/server/processUtils/processUtils";
import { ProcessErrorMessage, replace } from "../../../src/server/resources/messages";

describe(`Process Utils tests`, () => {

    let processWrapper: ProcessWrapper;

    beforeEach(() => {
        processWrapper = new ProcessWrapper();
    });

    afterEach(done => {
        if (processWrapper.isAlive) {
            processWrapper.onExit(() => {
                done();
            });

            processWrapper.killProcess();
        } else {
            done();
        }
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
            // tslint:disable-next-line: no-console
            console.log(lsContent);
        });

        processWrapper.writeToProcess("ls");
        processWrapper.killProcess();
    });

    /**
     * When writing to a process that has not been created/initalized
     * it should throw an error
     */
    it(`Throw Error when writing to a undefined process`, () => {
        expect(() => {
            processWrapper.writeToProcess("random command");
        }).toThrowError(ProcessErrorMessage.CAN_NOT_WRITE_TO_PROCESS_DOES_NOT_EXIST);
    });

    /**
     * When trying to create a new process when one already exists throw an error
     */
    it(`Throw Error when trying to create a new process when still active`, () => {
        const command = Helper.getCommandForPlatform();
        processWrapper.createChildProcess(command);

        expect(() => {
            processWrapper.createChildProcess(command);
        }).toThrow(replace(
            ProcessErrorMessage.CAN_NOT_CREATE_NEW_PROCESS_ORIGINAL_STILL_RUNNING,
            { command, originalCommand: command },
        ));
    });

    /**
     * Test that the event disconnect/unsubscribe works
     * NOTE - there is a small time lag with recieving data from the
     * process stdin thus, invoke discconect after the first call
     */
    it(`Disconnect from onData event`, done => {
        const dataBuffer: string[] = [];
        processWrapper.createChildProcess(Helper.getCommandForPlatform());

        // Listen to data after creating process
        // Windows first data will be inital console text, bash this does not occur
        const disconnectFromData = processWrapper.onData(data => {
            dataBuffer.push(data || "");
            // disconnect after first call to prevent subsequent listens
            disconnectFromData();
        });

        processWrapper.onExit(() => {
            expect(dataBuffer.length).toBe(1);
            done();
        });

        // listen to LS output
        processWrapper.writeToProcess("ls");

        // second LS, listener should not be getting second output
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
