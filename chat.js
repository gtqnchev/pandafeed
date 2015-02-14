var token = document.body.getAttribute("token"),
    React = require('react'),
    _ = require('underscore'),
    socket = io();

socket.on('ERR', function(error) {
    alert(error);
});

function formatTime(timestamp) {
    var time = new Date(Date.parse(timestamp));
    return time.toLocaleTimeString('en-En', { hour12: false });
}

var ChatBox = React.createClass({
    getInitialState: function() {
        return { users: [], messages: [] };
    },

    componentDidMount: function() {
        socket.on('request_authentication', function() {
            socket.emit('authenticate', token);
        });

        socket.on('initialize', function(data) {
            this.setState({
                self_id:  data.self_id,
                users:    data.users,
                messages: data.messages
            });
        }.bind(this));

        socket.on('update:users', function(data) {
            this.setState({
                users: data
            });
        }.bind(this));

        socket.on('update:user', function(data) {
            this.setState({
                user: data
            });
        }.bind(this));

        socket.on('history', function(data) {
            this.setState({
                messages: data.concat(this.state.messages)
            });
        }.bind(this));

        socket.on('message', function(message) {
            var messages = this.state.messages;
            messages.push(message);

            this.setState({
                messages: messages
            });
        }.bind(this));

        socket.on('like', function(message) {
            var messages_ids = _.map(this.state.messages, function(msg) {
                return msg._id;
            });

            var index = messages_ids.indexOf(message._id);

            if(index >= 0) {
                var messages = this.state.messages;
                messages[index] = message;

                this.setState({
                    messages: messages
                });
            }
        }.bind(this));
    },

    render: function() {
        return (
            <div className="chatBox row">
                <MessageBox messages={this.state.messages}/>
                <UserBox users={this.state.users} self_id={this.state.self_id}/>
            </div>
        );
    }
});

var MessageBox = React.createClass({
    scrollToBottom: function() {
        var message_list_node = this.refs.messageList.getDOMNode();
        message_list_node.scrollTop = message_list_node.scrollHeight;
    },

    isScolledToBottom: function() {
        var message_list_node = this.refs.messageList.getDOMNode();
        var scrollHeight = message_list_node.scrollTop + message_list_node.clientHeight;
        return scrollHeight === message_list_node.scrollHeight;
    },

    getInitialState: function() {
        return { floating: false };
    },

    componentWillReceiveProps: function() {
        this.setState({
            floating: !this.isScolledToBottom()
        });
    },

    componentDidUpdate: function(prev_props) {
        if(!this.state.floating) {
            this.scrollToBottom();
        }
    },

    render: function() {
        return (
            <div className="messageBox col-sm-9">
                <MessageList messages={this.props.messages} ref="messageList"/>
                <MessageForm />
            </div>
        );
    }
});

var MessageList = React.createClass({
    handleHistory: function() {
        var message = this.props.messages[0];

        if(message) {
            socket.emit('history', message.timestamp);
        }
    },

    render: function() {
        var messageNodes = this.props.messages.map(function(message) {
            return (
                <Message data={message}/>
            );
        });
        return (
            <div className="messageList">
                <button onClick={this.handleHistory} type="button" className="show-previous btn btn-default">
                    Load previous messages
                </button>
                {messageNodes}
            </div>
        );
    }
});

var Message = React.createClass({
    handleLike: function() {
        socket.emit('like', this.props.data._id, this.props.data.user_id);
    },

    render: function() {
        return (
            <div className="message">
                <div className="info">
                    <div><img className="img-rounded" src="http://placehold.it/70x70"/></div>
                </div>
                <div className="text">
                    <h4 className="message-info">
                        <small>[{formatTime(this.props.data.timestamp)}]</small> {this.props.data.user.name}:
                        <span onClick={this.handleLike}className="glyphicon glyphicon-thumbs-up"></span>
                        <small className="likes-count">Likes: {this.props.data.liked_by.length}</small>
                    </h4>
                    <hr/>
                    {this.props.data.text}
                </div>
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
        socket.emit("message", text);

        this.refs.text.getDOMNode().value = '';
    },

    render: function() {
        return (
            <form className="messageForm" onSubmit={this.handleSubmit}>
                <div className="form-group">
                    <input type="text" className="form-control" rows="3" placeholder="Say something..." ref="text"/>
                </div>
                <div className="form-group">
                    <input type="submit" className="btn btn-default pull-right" value="Send" />
                </div>
            </form>
        );
    }
});

var UserBox = React.createClass({
    render: function() {
        return (
            <div className="userBox col-sm-3">
                <div className="panel panel-default">
                    <div className="panel-heading">Online: {this.props.users.length}</div>
                    <UserList users={this.props.users} self_id={this.props.self_id}/>
                </div>
            </div>
        );
    }
});

var UserList = React.createClass({
    render: function() {
        var userNodes = this.props.users.map(function(user) {
            var blocked = (user.blocked_by.indexOf(this.props.self_id) >= 0);

            if (user._id === this.props.self_id) {
                return (<ThisUser name={user.name} />);
            }
            else {
                return (
                        <User name={user.name} id={user._id} blocked={blocked} />
                );
            }
        }.bind(this));

        return (
            <ul className="list-group">
                {userNodes}
            </ul>
        );
    }
});

var User = React.createClass({
    handleBlock: function() {
        if(this.props.blocked) {
            socket.emit("unblock", this.props.id);
        }
        else {
            socket.emit("block", this.props.id);
        }
    },

    render: function() {
        var icon_style = this.props.blocked ? "glyphicon glyphicon-volume-off" : "glyphicon glyphicon-volume-up";

        return (<li onClick={this.handleBlock} className="list-group-item">
                {this.props.name}
                <span className={icon_style}></span>
                </li>);
    }
});

var ThisUser = React.createClass({
    render: function() {
        return (<li className="list-group-item user">
                    {this.props.name}
                    <span className="glyphicon glyphicon-user"></span>
                </li>);
    }
});

React.render(
    <ChatBox />,
    document.getElementById('react')
);
