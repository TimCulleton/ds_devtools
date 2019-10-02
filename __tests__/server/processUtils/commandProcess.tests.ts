import { platform } from "os";
import { CommandProcess } from "../../../src/server/processUtils/commandProcess";

describe(`Command Process Tests`, () => {
    let commandProcess: CommandProcess | undefined;

    afterEach(done => {
        if (commandProcess && commandProcess.isAlive) {
            commandProcess.onExit(() => {
                done();
            });

            commandProcess.killProcess();
        } else {
            done();
        }
    });

    it(`Create Command Process`, () => {
        commandProcess = new CommandProcess();
        expect(commandProcess).toBeTruthy();

        const command = Helper.getCommandForPlatform();
        expect(commandProcess.command).toBe(command);
    });

    it(`Invoke LS command on process`, done => {
        commandProcess = new CommandProcess();
        commandProcess.onData(data => {
            expect(data).toBeTruthy();
            done();
        });

        commandProcess.writeToProcess("ls");
    });

    it(`Try to create new process`, () => {
        commandProcess = new CommandProcess();
        commandProcess.createChildProcess("test");
        expect(commandProcess.command).not.toBe("test");
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
