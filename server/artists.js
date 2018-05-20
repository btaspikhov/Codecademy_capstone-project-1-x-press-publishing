const artistsRouter = require('express').Router();

module.exports = artistsRouter;

const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

artistsRouter.get('/', (req, res, next) => {
    db.all(`SELECT * from Artist WHERE is_currently_employed='1'`, (error, rows) => {
        if (error) {
          return;
        } else {
            res.send({artists: rows});
        }
      });
  });

artistsRouter.get('/:artistId', (req, res, next) => {
    const artistId = req.params.artistId;
  db.get(`SELECT * from Artist WHERE id=$artistId`, 
    {
        $artistId: artistId  
    }, function(error, rows) {
        if (error) {
          return;
        } else if (!rows) {
            res.status(404).send();
        } else {
            res.send({artist: rows});
        }
    });
});

function checkArtist(artist, res) {
    if (!artist.name || !artist.dateOfBirth || !artist.biography) {
        res.status(400).send();
       return;
    }
}

artistsRouter.post('/', (req, res, next) => {
  const artist = req.body.artist;
  checkArtist(artist, res);
  
  db.run("INSERT INTO Artist (name, date_of_birth, biography) VALUES ($name, $date_of_birth, $biography)",
     {
        $name: artist.name,
        $date_of_birth: artist.dateOfBirth, 
        $biography: artist.biography
     }, function(error, rows) {
     if (error) {
       res.status(500).send();
       console.log(error);
       return;
     } else {
       db.get(
            "SELECT * FROM Artist WHERE id = $lastID",
         {
           $lastID: this.lastID
         }
         , (error, rows) => {
             const obj = { artist: rows };
             res.status(201).send(obj);
       });
     }
  });

});

artistsRouter.put('/:artistId', (req, res, next) => {
    const artist = req.body.artist;
    const id = req.params.artistId;
    checkArtist(artist, res);
    db.run("UPDATE Artist SET name=$name, date_of_birth=$date_of_birth, biography=$biography WHERE id=$artistId",
     {
        $artistId: id,
        $name: artist.name,
        $date_of_birth: artist.dateOfBirth, 
        $biography: artist.biography
     }, function(error, rows) {
     if (error) {
       res.status(500).send();
       console.log(error);
       return;
     } else {
       db.get(
            "SELECT * FROM Artist WHERE id = $artistId",
         {
           $artistId: id
         }
         , (error, rows) => {
             const obj = { artist: rows };
             res.send(obj);
       });
     }
  });
});

artistsRouter.delete('/:artistId', (req, res, next) => {
    const artist = req.body.artist;
    const id = req.params.artistId;
    db.run("UPDATE Artist SET is_currently_employed='0' WHERE id=$artistId",
     {
        $artistId: id
     }, function(error) {
     if (error) {
       res.status(500).send();
       return;
     } else {
       db.get(
            "SELECT * FROM Artist WHERE id = $artistId",
         {
           $artistId: id
         }
         , (error, rows) => {
             const obj = { artist: rows };
             res.send(obj);
       });
     }
  });
});
