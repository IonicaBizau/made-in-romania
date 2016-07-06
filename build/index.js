"use strict";

const madeIn = require("made-in")
    , languages = require("./languages")
    , oneByOne = require("one-by-one")
    , bindy = require("bindy")
    , rJson = require("r-json")
    , wJson = require("w-json")
    , packPath = require("package-json-path")
    , ucFirst = require("uc-first")
    ;

let _data = [];

function updatePack() {
    let result = [];
    _data.forEach(c => {
        result.push({ h3: ucFirst(c.lang) });
        result.push({
            table: {
                       headers: [":star2:", "Name", "Description", "🌍"]
              , rows: c.repos.map(cRepo => {

                    if (cRepo.owner.login.length > 20) {
                        cRepo.owner.login = cRepo.owner.login.substring(0, 20) + "…";
                    }

                    if (cRepo.name.length > 20) {
                        cRepo.name = cRepo.name.substring(0, 20) + "…";
                    }

                    cRepo.description = cRepo.description || "";
                    cRepo.description = cRepo.description.split(" ").map(c => {
                        if (c.length > 40) {
                            c = c.substring(0, 40) + "…";
                        }
                        return c;
                    }).join(" ");

                    let info = [
                        `[@${cRepo.owner.login}](${cRepo.owner.html_url})/[**${cRepo.name}**](${cRepo.html_url})`
                      , cRepo.description || ""
                      , cRepo.homepage || ""
                      , `${cRepo.stargazers_count}`
                    ]

                    return [
                        info[3]
                      , info[0]
                      , info[1]
                      , info[2] && `[:arrow_upper_right:](${info[2]})` || ""
                    ];
                })
            }
        });
    });

    let pack = packPath(`${__dirname}/../`)
      , packObj = rJson(pack)
      ;

    packObj.blah.description = result;

    wJson(pack, packObj);
}

oneByOne(bindy(languages, (cLang, done) => {
    console.log(`Fetching ${cLang} projects.`);
    madeIn("Romania", {
        token: process.env.GH_TOKEN
      , language: cLang
    }, (err, repos) => {
        if (err) { return done(err); }
        console.log(`Fetced ${repos.length} projects. Waiting 60 seconds.`);
        let left = 60
          , interval = setInterval(() => {
                --left;
                console.log(left);
            }, 1000)
          ;

        setTimeout(() => {
            clearInterval(interval);
            _data.push({ lang: cLang, repos: repos });
            updatePack();
            done();
        }, 60 * 1000);
    });
}), (err, data) => {
    if (err) { return console.error(err); }
    console.log("Done");
});

