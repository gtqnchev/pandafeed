var React = require('react');
var socket = io();

socket.on('welcome', function (data) {
    console.log('welcome: ', data);
});

socket.on('info', function(data) {
    console.log('info: ', data);
});

socket.on('message', function(data) {
    console.log('message: ', data);
});

var MessageBox = React.createClass({
    render: function() {
        return (
            <div className="messageBox">
                <h1>Messages</h1>
                <MessageList />
                <MessageForm />
            </div>
        );
    }
});

var MessageList = React.createClass({
    render: function() {
        return (
            <div className="messageList">
            messageList
            </div>
        );
    }
});

var Message = React.createClass({
    render: function() {
        return (
            <div className="message">
            message
            </div>
        );
    }
});

var MessageForm = React.createClass({
    render: function() {
        return (
            <div className="messageForm">
            messageForm
            </div>
        );
    }
});


var UserBox = React.createClass({
    render: function() {
        return (
            <div className="userBox">
                <h1>Users</h1>
                <UserList />
            </div>
        );
    }
});

var UserList = React.createClass({
    render: function() {
        return (
            <div className="userList">
            userList
            </div>
        );
    }
});

var User = React.createClass({
    render: function() {
        return (
            <div className="user">
                user
            </div>
        );
    }
});

React.render(
    <div>
        <MessageBox />
        <UserBox />
    </div>,
    document.getElementById('react')
);
