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

React.render(
    <h1>Reactive world, OMG!</h1>,
    document.getElementById('react')
);
