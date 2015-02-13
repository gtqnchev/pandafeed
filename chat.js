var token = document.body.getAttribute("token"),
    React = require('react'),
    socket = io();

socket.on('ERR', function(error) {
    alert(error);
});

var ChatBox = React.createClass({
    getInitialState: function() {
        return { users: [], messages: [] };
    },
    componentDidMount: function() {
        socket.on('request_authentication', function() {
            socket.emit('authenticate', token);
        });

        socket.on('init', function(data) {
            this.setState({
                users: data.users,
                messages: data.messages
            });
        }.bind(this));

        socket.on('users', function(data) {
            this.setState({
                users: data
            });
        }.bind(this));

        socket.on('message', function(message) {
            var messages = this.state.messages;
            messages.push(message);

            this.setState({
                messages: messages
            });
        }.bind(this));
    },
    render: function() {
        return (
            <div className="chatBox">
                <MessageBox messages={this.state.messages}/>
                <UserBox users={this.state.users}/>
            </div>
        );
    }
});

var MessageBox = React.createClass({
    render: function() {
        return (
            <div className="messageBox">
                <h1>Messages</h1>
                <MessageList messages={this.props.messages}/>
                <MessageForm />
            </div>
        );
    }
});

var MessageList = React.createClass({
    render: function() {
        var messageNodes = this.props.messages.map(function(message) {
            return (
                <Message data={message}/>
            );
        });
        return (
            <div className="messageList">
            {messageNodes}
            </div>
        );
    }
});

var Message = React.createClass({
    render: function() {
        return (
            <div className="message">
                {this.props.data.user.name}: {this.props.data.text}
            </div>
        );
    }
});

var MessageForm = React.createClass({
    handleSubmit: function(e) {
        e.preventDefault();
        var text = this.refs.text.getDOMNode().value.trim();
        if (!text) {
            return;
        }
        socket.emit("message", { text: text });

        this.refs.text.getDOMNode().value = '';
    },
    render: function() {
        return (
            <form className="messageForm" onSubmit={this.handleSubmit}>
                <input type="text" placeholder="Say something..." ref="text"/>
                <input type="submit" value="Post" />
            </form>
        );
    }
});


var UserBox = React.createClass({
    render: function() {
        return (
            <div className="userBox">
                <h1>Users</h1>
                <UserList users={this.props.users}/>
            </div>
        );
    }
});

var UserList = React.createClass({
    render: function() {
        var userNodes = this.props.users.map(function(user) {
            return (
                    <User name={user.name} />
            );
        });

        return (
            <div className="userList">
                {userNodes}
            </div>
        );
    }
});

var User = React.createClass({
    render: function() {
        return (
            <div className="user">
                {this.props.name}
            </div>
        );
    }
});

React.render(
    <ChatBox />,
    document.getElementById('react')
);
