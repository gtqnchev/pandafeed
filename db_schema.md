# Заявки

Зареждане на чата за потребителя X
 * Достъпване на последните N съобщения, които не са на потребителите блокирани от потребителя X.

Получаване на съобщение от потребителя X на сървъра.
 * Достъпване на всички потребители, които не са блокирани от X. (За да им се изпрати файла)

# Schema

users collection

```
user: _id:          objectID,
      name:         string,
      password:     string,
      avatar_id:    objectID,
      token:        string,
      blocked_by:   [user1_id, user2_id, ...]
```

messages collection

```
message: _id:       objectID
         user_id:   objectID
         user:      { name:      string
                      avatar_id: objectID }
         text:      string
         timestamp: time
         liked_by:  [user1_id, user2_id, ...]
         blocked_by:[user1_id, user2_id, ...] (consistent chat history)
```
