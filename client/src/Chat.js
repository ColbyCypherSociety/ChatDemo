import React from 'react';

// Needed because of some javascript weirdness
import 'babel-polyfill';

const js = import("../../crypto_module");

class Chat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          messages: [],
          message: '',
          encrypt: '',
        };

        this.send = this.send.bind(this);
        this.encrypt = this.encrypt.bind(this);
        this.onChangeMessage = this.onChangeMessage.bind(this);
        this.onChangeEncrypt = this.onChangeEncrypt.bind(this);
      }

    async componentDidMount() {
        // Call the rust code from js
        const crypto = await js;

        const seedOne = this.generateSeed();
        const seedTwo = this.generateSeed();
        const keypair = crypto.Keypair.new(seedOne, seedTwo);

        const socket = require('socket.io-client')('http://localhost:3001');

        // Stupid hack for accessing this in the socket events
        const obj = this;

        // Actions for when connecting to server
        socket.on('connect', function(){
            // For registering with the channel on connect
            socket.emit('REGISTER', keypair.public_key_display_wasm());

            const temp = obj.state.messages;
            temp.push("Connected successfully to server.");
            obj.setState({
                messages: temp,
            });
        });

        // For displaying all chat room messages
        socket.on('MESSAGE', function(data){
            const temp = obj.state.messages;
            temp.push(data);
            obj.setState({
                messages: temp,
            });
        });

        // For displaying new registration when new users connect
        socket.on('NEW_REGISTRATION', function(data){
            const temp = obj.state.messages;
            temp.push(`User joined: ${data}`);
            obj.setState({
                messages: temp,
            });
        });

        // For displaying when new users disconnect
        socket.on('DISCONNECTED', function(data){
            const temp = obj.state.messages;
            temp.push(`User left: ${data}`);
            obj.setState({
                messages: temp,
            });
        });

        // Actions for when disconnecting from server
        socket.on('disconnect', function(){
            socket.emit('DISCONNECTED', 'name')
            const temp = obj.state.messages;
            temp.push("Disconnected from server.");
            obj.setState({
                messages: temp,
            });
        });

        this.setState({
            socket,
            keypair,
        })
    }

    generateSeed() {
        let seed = [];
        for (var i = 0; i < 32; i ++) {
            seed.push(Math.floor(Math.random() * 100));
        }

        return seed;
    }

    onChangeMessage(e) {
        this.setState({
            message: e.target.value,
        })
    }

    send() {
        this.state.socket.emit('MESSAGE', this.state.message);
        this.setState({
            message: '',
        });
    }

    onChangeEncrypt(e) {
        this.setState({
            encrypt: e.target.value,
        })
    }

    encrypt() {
        this.state.socket.emit('MESSAGE', this.state.encrypt);
        this.setState({
            encrypt: '',
        });
    }

    render() {
        return (
            <div>
                <ul id="messages">
                    {this.state.messages.map(x => <li>{x}</li>)}
                </ul>
                <form action="">
                    <div className="inputbox">
                        <input autoComplete="off" onChange={this.onChangeMessage} value={this.state.message}/>
                        <button onClick={this.send} type="button">Send</button>
                    </div>
                    <div className="inputbox">
                        <input autoComplete="off" onChange={this.onChangeEncrypt} value={this.state.encrypt}/>
                        <button onClick={this.encrypt} type="button">Encrypt</button>
                    </div>
                </form>
            </div>
        );
    }
}

export default Chat;
