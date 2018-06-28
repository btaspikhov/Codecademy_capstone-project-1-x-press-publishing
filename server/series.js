const seriesRouter = require('express').Router();

module.exports = seriesRouter;

const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

seriesRouter.get('/', (req, res, next) => {
    db.all(`SELECT * from Series`, (error, rows) => {
        if (error) {
          return;
        } else {
            res.send({series: rows});
        }
      });
  });

function checkSeries(series, res) {
    if (!series.name || !series.description) {
        res.status(400).send();
       return;
    }
}

seriesRouter.post('/', (req, res, next) => {
  const series = req.body.series;
  checkSeries(series, res);
  
  db.run("INSERT INTO Series (name, description) VALUES ($name, $description)",
     {
        $name: series.name,
        $description: series.description
     }, function(error) {
     if (error) {
       res.status(500).send();
       console.log(error);
       return;
     } else {
       db.get(
            "SELECT * FROM Series WHERE id = $lastID",
         {
           $lastID: this.lastID
         }
         , (error, rows) => {
             const obj = { series: rows };
             res.status(201).send(obj);
       });
     }
  });

});

seriesRouter.get('/:seriesId', (req, res, next) => {
  const seriesId = req.params.seriesId;
  db.get(`SELECT * from Series WHERE id=$seriesId`, 
    {
        $seriesId: seriesId  
    }, function(error, rows) {
        if (error) {
          return;
        } else if (!rows) {
            res.status(404).send();
        } else {
            res.send({series: rows});
        }
    });
});

seriesRouter.put('/:seriesId', (req, res, next) => {
    const series = req.body.series;
    const id = req.params.seriesId;
    checkSeries(series, res);
    db.run("UPDATE Series SET name=$name, description=$description WHERE id=$seriesId",
     {
        $seriesId: id,
        $name: series.name,
        $description: series.description
     }, function(error) {
     if (error) {
       res.status(500).send();
       console.log(error);
       return;
     } else {
       db.get(
            "SELECT * FROM Series WHERE id = $seriesId",
         {
           $seriesId: id
         }
         , (error, rows) => {
             const obj = { series: rows };
             res.send(obj);
       });
     }
  });
});


seriesRouter.delete('/:seriesId', (req, res, next) => {
    const series = req.body.series;
    const id = req.params.seriesId;
    db.get(
        "SELECT COUNT(*) AS count FROM Issue WHERE series_id = $seriesId",
     {
       $seriesId: id
     }
     , (error, rows) => {
         if (rows.count !== 0) {
            res.status(400).send();;
         } else {
            db.run("DELETE FROM Series WHERE id=$seriesId",
                {
                   $seriesId: id
                }, function(error) {
                if (error) {
                  res.status(500).send();
                  return;
                } else {
                    res.status(204).send();
                }
            });
         }
     });
   
});

seriesRouter.get('/:seriesId/issues', (req, res, next) => {
    const seriesId = req.params.seriesId;
    
    db.get(`SELECT * from Series WHERE id=$seriesId`, 
      {
          $seriesId: seriesId  
      }, function(error, rows) {
          if (error) {
            return;
          } else if (!rows) {
              res.status(404).send();
          } else {
            db.all(`SELECT * from Issue WHERE series_id=$seriesId`, 
                {
                    $seriesId: seriesId  
                }, function(error, rows) {
                    if (error) {
                      return;
                    } else if (!rows) {
                        res.send({issues: []});
                    } else {
                        res.send({issues: rows});
                    }
                });
          }
      });
       
  });

function checkIssue(issue, res) {
    if (!issue.name || !issue.issueNumber || !issue.publicationDate || !issue.artistId) {
        res.status(400).send();
       return;
    }
}

seriesRouter.post('/:seriesId/issues', (req, res, next) => {
  const issue = req.body.issue;
  checkIssue(issue, res);

  const seriesId = req.params.seriesId;
  
  db.get(`SELECT * from Series WHERE id=$seriesId`, 
    {
        $seriesId: seriesId  
    }, function(error, rows) {
        if (error) {
          return;
        } else if (!rows) {
            res.status(404).send();
        } else {
            db.run(`INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) ` +
                   `VALUES ($name, $issue_number, $publication_date, $artist_id, $series_id)`,
                {
                   $name: issue.name,
                   $issue_number: issue.issueNumber,
                   $publication_date: issue.publicationDate,
                   $artist_id: issue.artistId,
                   $series_id: seriesId
                }, function(error) {
                if (error) {
                  res.status(500).send();
                  console.log(error);
                  return;
                } else {
                  db.get(
                       "SELECT * FROM Issue WHERE id = $lastID",
                    {
                      $lastID: this.lastID
                    }
                    , (error, rows) => {
                        const obj = { issue: rows };
                        res.status(201).send(obj);
                  });
                }
            });
        }
    });
  
});

seriesRouter.put('/:seriesId/issues/:issueId', (req, res, next) => {
    const issue = req.body.issue;
    checkIssue(issue, res);

    const seriesId = req.params.seriesId;
    const issueId = req.params.issueId;

    db.serialize(() => {
        db.get(`SELECT * from Series WHERE id=$seriesId`, 
            {
                $seriesId: seriesId  
            }, function(error, rows) {
                if (error) {
                  return;
                } else if (!rows) {
                    res.status(404).send();
                }
            });
        db.get(`SELECT * from Issue WHERE id=$issueId`, 
            {
                $issueId: issueId  
            }, function(error, rows) {
                if (error) {
                  return;
                } else if (!rows) {
                    res.status(404).send();
                }
            });
        
        db.run(`UPDATE Issue SET name=$name, issue_number = $issue_number, publication_date = $publication_date, ` + 
               `artist_id = $artist_id, series_id = $series_id WHERE id=$issueId`,
            {
                $name: issue.name,
                $issue_number: issue.issueNumber,
                $publication_date: issue.publicationDate,
                $artist_id: issue.artistId,
                $series_id: seriesId,
                $issueId: issueId
            }, function(error) {
            if (error) {
              res.status(500).send();
              console.log(error);
              return;
            } else {
              db.get(
                   "SELECT * FROM Issue WHERE id = $issueId",
                {
                  $issueId: issueId
                }
                , (error, rows) => {
                    const obj = { issue: rows };
                    res.send(obj);
              });
            }
        });
        
        
    });
       
});

seriesRouter.delete('/:seriesId/issues/:issueId', (req, res, next) => {

    const seriesId = req.params.seriesId;
    const issueId = req.params.issueId;

    db.serialize(() => {
        db.get(`SELECT * from Series WHERE id=$seriesId`, 
            {
                $seriesId: seriesId  
            }, function(error, rows) {
                if (error) {
                  return;
                } else if (!rows) {
                    res.status(404).send();
                }
            });
        db.get(`SELECT * from Issue WHERE id=$issueId`, 
            {
                $issueId: issueId  
            }, function(error, rows) {
                if (error) {
                  return;
                } else if (!rows) {
                    res.status(404).send();
                }
            });
        
        db.run("DELETE FROM Issue WHERE id=$issueId",
            {
               $issueId: issueId
            }, function(error) {
            if (error) {
              res.status(500).send();
              return;
            } else {
                res.status(204).send();
            }
        });
        
    });
   
});
