import { execSync, exec } from 'child_process';
import { Project, Device } from './models';
import { extensions } from 'vscode';
import * as res from './resources';
import * as path from 'path';


export class CommandInterface {
    private static extensionPath: string = extensions.getExtension(`${res.extensionPublisher}.${res.extensionId}`)?.extensionPath ?? '';
    private static toolPath: string = path.join(CommandInterface.extensionPath, "extension", "bin", "DotNet.Meteor.CommandLine.dll"); 

    public static androidSdk(): string {
        return ProcessRunner.runSync<string>(new ProcessArgumentBuilder("dotnet")
            .appendQuoted(CommandInterface.toolPath)
            .append("--android-sdk-path"));
    }
    public static async getDevices(): Promise<Device[]> {
        return await ProcessRunner.runAsync<Device[]>(new ProcessArgumentBuilder("dotnet")
            .appendQuoted(CommandInterface.toolPath)
            .append("--all-devices"));
    }
    public static async getProjects(folders: string[]): Promise<Project[]> {
        return await ProcessRunner.runAsync<Project[]>(new ProcessArgumentBuilder("dotnet")
            .appendQuoted(CommandInterface.toolPath)
            .append("--analyze-workspace")
            .appendRangeQuoted(folders));
    }
    public static async xamlSchema(path: string): Promise<boolean>  {
        return await ProcessRunner.runAsync<boolean>(new ProcessArgumentBuilder("dotnet")
            .appendQuoted(CommandInterface.toolPath)
            .append("--xaml")
            .appendQuoted(path));
    }
    public static async xamlReload(port: number, path: string): Promise<boolean>  {
        return await ProcessRunner.runAsync<boolean>(new ProcessArgumentBuilder("dotnet")
            .appendQuoted(CommandInterface.toolPath)
            .append("--xaml-reload")
            .append(port.toString())
            .appendQuoted(path));
    }
}

class ProcessRunner {
    public static runSync<TModel>(builder: ProcessArgumentBuilder): TModel {
        const result = execSync(builder.build()).toString();
        return JSON.parse(result);
    }
    public static async runAsync<TModel>(builder: ProcessArgumentBuilder): Promise<TModel> {
        return new Promise<TModel>((resolve, reject) => {
            exec(builder.build(), (error, stdout, stderr) => {
                if (error) {
                    console.error(error);
                    reject(error);
                } else {
                    const item: TModel = JSON.parse(stdout.toString());
                    resolve(item);
                }
            })
        });
    }
}

export class ProcessArgumentBuilder {
    private args: string[] = [];

    public constructor(command: string) {
        this.args.push(command);
    }

    public append(arg: string): ProcessArgumentBuilder {
        this.args.push(arg);
        return this;
    }
    public appendQuoted(arg: string): ProcessArgumentBuilder {
        this.args.push(`"${arg}"`);
        return this;
    }
    public appendRangeQuoted(arg: string[]): ProcessArgumentBuilder {
        arg.forEach(a => this.args.push(`"${a}"`));
        return this;
    }
    public override(arg: string): ProcessArgumentBuilder {
        const argName = arg.split("=")[0];
        const index = this.args.findIndex(a => a.startsWith(argName));
        if (index > -1) 
            this.args.splice(index, 1);
        this.args.push(arg);
        return this;
    }
    public build(): string {
        return this.args.join(" ");
    }
}
  