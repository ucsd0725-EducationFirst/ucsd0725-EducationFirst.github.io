
var industries = [{"get_agri_ed":"agriculture"}, {"get_arch_ed":"architecture"}, {"get_biological_ed":"biological"},
                {"get_business_marketing_ed":"business_marketing"}, {"get_communication_ed":"communication"},
                {"get_communications_technology_ed":"communications_technology"}, {"get_computer_ed":"computer"},
                {"get_construction_ed":"construction"}, {"get_education_ed":"education"}, {"get_engg_ed":"engineering"},
                {"get_engineering_technology_ed":"engineering_technology"}, {"get_english_ed":"english"},
                {"get_ethnic_cultural_gender_ed":"ethnic_cultural_gender"},
                {"get_family_consumer_science_ed":"family_consumer_science"}, {"get_health_ed":"health"},
                {"get_history_ed":"history"}, {"get_humanities_ed":"humanities"}, {"get_language_ed":"language"},
                {"get_legal_ed":"legal"}, {"get_library_ed":"library"}, {"get_mathematics_ed":"mathematics"},
                {"get_mechanic_repair_technology_ed":"mechanic_repair_technology"}, {"get_military_ed":"military"},
                {"get_multidiscipline_ed":"multidiscipline"}, {"get_parks_recreation_fitness_ed":"parks_recreation_fitness"},
                {"get_personal_culinary_ed":"personal_culinary"}, {"get_philosophy_religious_ed":"philosophy_religious"},
                {"get_physicalscience_ed":"physical_science"}, {"get_precision_production_ed":"precision_production"},
                {"get_psychology_ed":"psychology"}, {"get_public_administration_social_service_ed":"public_administration_social_service"},
                {"get_resources_ed":"resources"}, {"get_science_technology_ed":"science_technology"},
                {"get_security_law_enforcement_ed":"security_law_enforcement"}, {"get_social_science_ed":"social_science"},
                {"get_theology_religious_vocation_ed":"theology_religious_vocation"}];

function SendEntityQuery(){
    $.ajax({
        url: 'https://api.wit.ai/entities/intent?v=20170307',
        data: {
            'access_token' : "5HSSLZ5IRHZEJVKTQRF7YOT6NVY442FB"
        },
        dataType: 'jsonp',
        method: 'GET',
        success: function(response) {
            console.log("success!", response);
            for (var i =0; i < response.values.length; i++) {
                var trow= $("<tr>");
                var tdintent = $("<td>");
                tdintent.html("<b>" + response.values[i].value + "</b>");
                trow.append(tdintent);
                var exps = response.values[i].expressions.join(", ");
                var tdintentexps = $("<td>");
                tdintentexps.html("<i>" + exps + "</i>");
                trow.append(tdintentexps);
                $("#tbd").append(trow);
            }
        }
    });
}

function SendStatementQuery(question, callback) {
    $.ajax({
        url: 'https://api.wit.ai/message?v=20170307',
        data: {
            'q': question,
            'access_token': "5HSSLZ5IRHZEJVKTQRF7YOT6NVY442FB"
        },
        dataType: 'jsonp',
        method: 'GET',
        success: function(response) {
            var responseOb = {};
            console.log("success!", response);
            if (response.entities.intent !== undefined && response.entities.intent !== null) {
                if(response.entities.intent[0].value === "affirmation" ||
                   response.entities.intent[0].value === "negation" ||
                   response.entities.intent[0].value === "confirmation") {
                    console.log("affirmation/negation/confirmation intent");
                    responseOb = {"industry":null, "answer":response.entities.intent[0].value, "location":null, "message":response._text};
                } else {
                    console.log("not a confirmation/affirmation");
                    responseOb = {"industry": response.entities.intent[0].value, "answer": null,"location": null,"message": response._text};
                    if (response.entities.location !== undefined && response.entities.location !== null){
                        console.log("industry location intent");
                        console.log(response.entities.location[0].value);
                        responseOb.location = response.entities.location[0].value;
                    }
                }
            } else if (response.entities.location !== undefined && response.entities.location !== null) {
                console.log("location intent")
                responseOb = {"industry":null, "answer": null, "location": response.entities.location[0].value, "message": response._text};
            }

            console.log("logging response from witai interface");
            console.log(responseOb);

            var retOb = Object.assign({},responseOb);
            console.log("logging copy object in queryfunc");
            console.log(retOb);
            callback(retOb);
        }
    });
}

/* test queries
SendEntityQuery();
SendStatementQuery("colleges having computer program");
SendStatementQuery("yeah",callback);
SendStatementQuery("perhaps",callback);
SendStatementQuery("nevada",callback);
SendStatementQuery("houston",callback);
SendStatementQuery("oceanography",callback);
SendStatementQuery("english program in texas",callback);
SendStatementQuery("public relations in iowa",callback);
SendStatementQuery("legal",callback);
SendStatementQuery("marketing",callback);
SendStatementQuery("healthcare",callback);
*/
