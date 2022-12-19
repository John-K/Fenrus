const Settings = require('../models/Settings');
const docker = require('dockerode');
var stream = require('stream');

class DockerService 
{
    socket;
    docker;
    app;
    stream;
    timeOutTimer;
    AUTO_TIMEOUT = 10 * 60 * 1000;

    constructor(socket, app, system)
    {
        this.socket = socket;
        this.app = app;
        let dockerInstance = system.Docker?.filter(x => x.Uid === app.DockerUid);
        if(dockerInstance?.length)
            dockerInstance = dockerInstance[0];
        if(dockerInstance?.Address){
            this.docker = new docker({
                host: dockerInstance.Address,
                port: dockerInstance.Port || 2375
            });
        }
        else {            
            this.docker = new docker();
        }
    }

    async getContainer(name) {
        if(!name)
            throw 'Name not given';
        return await new Promise((resolve, reject) => {
            name = name.toLowerCase();
            this.docker.listContainers({all: true}, (err, containers) => {
                if(err)
                    console.error('err', err);
                for(let i=0; i < containers?.length; i++) {
                    let c = containers[i];
                    for(let j=0;j<c.Names?.length; j++){
                        let cName = c.Names[j].toLowerCase();
                        if(cName.startsWith('/'))
                            cName = cName.substring(1);
                        console.log(`### comparing container name '${cName}' to '${name}'`);
                        if(cName === name){
                            resolve(c);
                            return;
                        }
                    }
                }
                console.log('### failed to locate any matching containers');
                resolve(null);
            });
        });
    }

    async loadContainer(){

        let name = this.app.DockerContainer;
        if(!name){
            this.socket.emit('fenrus-error', 'Name not set on container');
            console.log('##### Name not set on container', this.app);
            return;
        }
        const containerByName = await this.getContainer(name);        
        if(!containerByName){
            this.socket.emit('fenrus-error', 'Failed to find container');
            console.log('##### failed to locate container by name: ', this.app.DockerContainer);
            return;
        }
        const container = this.docker.getContainer(containerByName.Id);
        if(!container){
            this.socket.emit('fenrus-error', 'Failed to find container');
            console.log('##### failed to locate container: ', this.app.DockerContainer, container);
            return;
        }
        return { container, containerByName };
    }

    async log(rows, cols) {
        let gc = await this.loadContainer();
        if(!gc)
            return;
        const container = gc.container;
        const containerByName = gc.containerByName;

        var logStream = new stream.PassThrough();
        logStream.on('data', (chunk) => {
            let line = chunk.toString('utf8');
            this.socket.emit('data', line);
        });

        container.logs({
            follow: true,
            stdout: true,
            tail:100,
            stderr: true
        }, (err, stream) => {
            if(err) 
                return logger.error(err.message);
            container.modem.demuxStream(stream, logStream, logStream);
            stream.on('end', () => {
                logStream.end('!stop!');
            });
            this.socket.on('disconnect', () => {
                console.log('####socket closed');
                stream.destroy();
            });
        });
    }

    async init(rows, cols)
    {
        let gc = await this.loadContainer();
        if(!gc)
            return;
        const container = gc.container;
        const containerByName = gc.containerByName;

        let cmd = {
            Cmd: [this.app.DockerCommand || '/bin/bash'],
            AttachStdout: true,
            AttachStderr: true,
            AttachStdin: true,
            Tty: true,
            Env: ['LINES=' + rows, 'COLUMNS='+ cols]
        };
        this.socket.on('resize', (data) => {
            container.resize({h: data.rows, w: data.cols}, () => {
            });
        });
        container.exec(cmd, (err, exec) => {
            let options = {
                Tty: true,
                stream: true,
                stdin: true,
                stdout: true,
                stderr: true,
                hijack: true
            };

            container.wait((err, data) => {
                this.socket.emit('terminal-closed', '');
            });

            if (err) {
                console.log('### this.docker err: ', err);
                return;
            }
            exec.start(options, (err, stream) => {
                this.stream = stream;
                this.resetTimeout();
                let name = containerByName.Names;
                if(Array.isArray(name) && name.length > 0)
                    name = name[0];
                if(name?.startsWith('/'))
                    name = name.substring(1);
                if(!name)
                    name = this.app.DockerContainer;
                this.socket.emit('data', `\r\n*** Connected to ${name} ***\r\n\r\n`);
                stream.on('data', (chunk) => {
                    let data = chunk.toString();
                    this.socket.emit('data', data);
                });
                this.socket.on('resize', (data) => {
                    container.resize({h: data.rows, w: data.cols});
                });
                stream.on('end', () => {
                    this.socket.emit('terminal-closed', '');
                });

                this.socket.on('data', (data) => {
                    if (typeof data !== 'object')
                    {
                        stream.write(data);
                        this.resetTimeout();
                    }
                });
            });
        });
    }

    resetTimeout(){
        if(this.timeOutTimer)
            clearTimeout(this, this.timeOutTimer);
        this.timeOutTimer = setTimeout(() => this.closeSocket(), this.AUTO_TIMEOUT);
    }

    closeSocket()
    {
        console.log('### AUTOMATICALLY TIMEOUT OUT DOCKER CONNECTION');
        try{
            if(this.socket){
                this.socket.emit('terminal-closed', '');
            }
            if(this.stream){
                this.stream.end();
            }
        }catch(err) {
            console.log('### error: ', err);
        }
    }
}

module.exports = DockerService;
