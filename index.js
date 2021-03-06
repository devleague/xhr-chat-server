var Hapi  = require( 'hapi' );
var Joi   = require( 'joi' );
var Fs    = require( 'fs' );
var Path  = require( 'path' );

var dbPath = Path.join( process.cwd(), '/database/chatrooms.json' );

var server = new Hapi.Server({
  connections: {
    routes: {
      cors: true
    },
    router: {
      stripTrailingSlash: true
    }
  }
});

server.connection({
  host: '0.0.0.0',
  port: 1337
});

server.register({register: require( 'lout' ) }, function( err ) {
  if ( err ) { console.log( err ) }
});

server.start();

server.route({
  method: 'GET',
  path: '/{id}',
  handler: getMessagesByChatroomId
});

function getMessagesByChatroomId( request, reply ) {
  var db = getDatabase( request.params.id );

  reply( db[request.params.id].messages );
}

server.route({
  method: 'POST',
  path: '/{id}',
  handler: setNewMessageByChatroomId,
  config: {
    validate: {
      payload: {
        name: Joi.string().required().trim().alphanum().min( 3 ).max( 16 ),
        message: Joi.string().required().trim().min( 12 )
      }
    }
  }
});

function setNewMessageByChatroomId( request, reply ) {
  var db = getDatabase( request.params.id );

  // client sends name and message in payload
  db[request.params.id].messages.push({
    name: request.payload.name,
    message: request.payload.message,
    room: request.params.id,
    timestamp: new Date(),
    id: db[request.params.id].messages.length
  });

  // save the file
  Fs.writeFile( './database/chatrooms.json', JSON.stringify( db ), function( err ) {
    if ( err ) return console.log( err );
    console.log( 'new message added to the room: ' + request.params.id );
  });

  reply( db[request.params.id].messages );
}

server.route({
  method: 'GET',
  path: '/{id}/clear',
  handler: function( request, reply ) {
    var db = getDatabase( request.params.id );

    db[request.params.id].messages = [];

    // save the file
    Fs.writeFile( './database/chatrooms.json', JSON.stringify( db ), function( err ) {
      if ( err ) return console.log( err );
      console.log( 'messages have been cleared from the room: ' + request.params.id );
    });

    reply( db[request.params.id].messages );
  }
});

function getDatabase( roomId ) {
  var db = require( dbPath );

  if ( typeof db[roomId] === 'undefined' ) {
    db[roomId] = {
      name: roomId,
      messages: []
    };

    // save the file since we made changes
    Fs.writeFile( dbPath, JSON.stringify( db ), function( err ) {
      if ( err ) return console.log( err );
      console.log( 'database was updated with a new room: ' + roomId );
    });
  }

  return db;
}
