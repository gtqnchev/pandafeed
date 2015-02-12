module.exports = {
    users: [
        { _id: 1,
          name: 'Georgi',
          avatar_id: 1 },
        { _id: 2,
          name: 'Petyr',
          avatar_id: 2 }
    ],

    messages: [
        { _id: 1,
          user_id: 2,
          user: { name: 'Petyr',
                  avatar_id: 2 },
          text: 'Pandas are so cool.',
          timestamp: new Date(),
          likes: [] },
        { _id: 2,
          user_id: 1,
          user: { name: 'Georgi',
                  avatar_id: 1 },
          text: 'Yeah man, but don not feed them.',
          timestamp: new Date(),
          likes: [1] }
    ]
};
