# Заявки

Зареждане на чата за потребителя X
 * Достъпване на последните N съобщения, които не са на потребителите блокирани от потребителя X.

Получаване на съобщение от потребителя X на сървъра.
 * Достъпване на всички потребители, които не са блокирани от X. (За да им се изпрати файла)

# Schema

users collection

```
user: _id:       objectID,
      name:      string,
      password:  string,
      avatar_id: objectID
      blocked:   [user1_id, user2_id, ...]
```

messages collection

```
message: _id:       objectID
         user_id:   objectID
         user:      { name:      string
                      avatar_id: objectID }
         text:      string
         timestamp: time
         likes:     [msg1_id, msg2_id, ...]
```
