var c = 0;
var db, fest; 
var data, films, comps, comp_contacts, comp_phones, comp_ph_labels
var film_count, comp_count, comp_contact_count, comp_phone_count, comp_ph_label_count, screening_count
var initial_id = 0, search_string = ''
var first_run = 1, first_run_comp = 1, first_run_abc = 1, abc_all_first_run = 1, faves_first_run = 1, first_run_screening = 1
var order_by_salesco = 0, order_by_section = 0, order_by_abc = 0, removeDeleteFlag = 1, debounce = 0, first_run_section = 1
var first_run_screening_venue = 1, first_run_abc_2 = 1, first_run_datelist = 1
var nid, contacts = 0;  
var comp_name, comp_addr, which_list
var today = new Date();
var dd = today.getDate();
var mm = today.getMonth()+1;//January is 0, so always add + 1
var yyyy = today.getFullYear();
var tme = today.getTime().toString();
var dte;

db = window.openDatabase("Orange", "1.0", "Orange_Mobile_DB", 1000000);
document.addEventListener("deviceready", onDeviceReady, false);

  // Cordova is ready
  //
  
$(document).ready(function(){
    //
    if (!window.openDatabase) {
     alert('Databases are not supported in this browser.');
     return;
    }
   $('li[nid=1]').hide()

})

function onDeviceReady() {
      
//
if (!window.openDatabase) {
 alert('Databases are not supported in this browser.');
 return;
}

/*if (navigator.notification) {
        navigator.notification.alert(
        'Device Ready!',  // message
        function() {},    // callback
        'Orange Dev',     // title
        'Done'            // buttonName
);    } else {
           alert('Notification not installed');
}*/
   console.log('-----------------------------------------------------------------------')         
$('#m_main_page').trigger('create') 

}  //<---- end OnDeviceReady

function startInit(tx){
      // Check to see if database exists
      console.log('Enter startInit')
      tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name='ACCESS_LOG'", [], function (tx, result) {
          $.support.cors = true;
          $.mobile.allowCrossDomainPages = true;
          console.log('Checking for connection....')
          if (result.rows.length == 0) {
              //No data in app - check to see if we have a connection to server
              $.ajax({
                type: 'POST',
                dataType : 'json',
                cache: false,
                crossDomain: true,
                url: 'http://www.orange-ent.net/m_check_connection',
                error: function(jqXHR, txtStatus, errorThrown){ 
                    // No connection so tell user to try later  
                    console.log('No connection found')  
                    $('#question').text('No internet connection found.  Please connect your phone to the Internet so Orange Entertainment data can be loaded.')  
                    $("#confirm").popup("open");
                    $("#confirm #yes").on("click", function(event){
                        console.log("Can't log in - no data in app")
                        $("#confirm").popup("close");  
                    })     
                },
                success: function(obj){
                    // Connection so start data load 
                    fest = JSON.stringify(obj)  
                    console.log('Complete load required.  Connection found. Festival ID: '+ fest) 
                    db.transaction(populateFilms);
                }
              })  
          }
          else
          {            
              console.log('Tables found.  Get Table lengths') 
              getTableLengths(tx);
              // APP HAS DATA - check for connection to check for updates - not critical to app running 
              console.log('Check connection.')
              $.ajax({
                type: 'POST',
                dataType : 'json',
                cache: false,
                crossDomain: true,
                url: 'http://www.orange-ent.net/m_check_connection',
                error: function(jqXHR, txtStatus, errorThrown){
                    console.log('No connection found.  Tell user.') 
                    $('#question').text('Unable to update data.  You may use app but the data may not be up to date.')
                    $("#confirm").popup( "open" );
                    $("#confirm #yes").on("click", function(event){
                        console.log('User confirmed okay to proceed with no updates')
                        $("#confirm").popup("close");  
                        $.mobile.changePage("#m_springboard", { transition: "slide", pageReload:false} );
                    })
                },
                success: function(obj){ 
                    fest = JSON.stringify(obj)   
                    console.log('connection made - current fest: ' + fest)
                    db.transaction(function dumdum(tx){tx.executeSql("SELECT * FROM ACCESS_LOG", [], function (tx, results) {  
                         console.log('App currently has fest ' + results.rows.item(0).fest)  
                             
                         if(results.rows.item(0).fest == fest)
                         {     
                             console.log('Same fest so update data')
                             db.transaction(getUpdatedFilmData);
                         }           
                         else
                         {   
                             $('#confirm-new-fest-spring').popup({ history: false });  
                             $('#confirm-new-fest-spring').popup("open")
                             console.log("New festival data available from server - ask user if it's okay to proceed") 
                             $("#confirm-new-fest #yes2").on("click",function(event){
                                 console.log("User OK'ed downloading new festival")  
                                 clearTables;
                                 db.transaction(populateFilms);
                                 //$.mobile.changePage("#m_springboard", { transition: "slide"} );
                             })
                             $("#confirm-new-fest #no2").on("click",function(event){ 
                                 console.log('User elected not to download new fest from login')    
                                 $('#confirm-new-fest').popup("close") 
                                 //$.mobile.changePage("#m_springboard", { transition: "slide"} );       
                             })
                         }
                     })
                 })
                }
              })
          }      
      });
}     

function clearTables(){
    console.log('Clearing all data from all tables') 
    db.transaction(function dumb(tx,result){tx.executeSql("DROP TABLE IF EXISTS FILMS", [], function (tx, result) { 
        console.log('clear films - ' + result)     
      }, errorCB);})  
    $('#the-list').remove() 
    $('#the-list').trigger('create')
    db.transaction(function dumb2(tx,result){tx.executeSql("DROP TABLE IF EXISTS COMPS", [], function (tx, result) { 
        console.log('clear comp_count') 
    }, errorCB);  }) 
    $('#m_comp_results').remove()
    $('#m_comp_results').listview("refresh"); 
    db.transaction(function dumb3(tx,result){tx.executeSql("DROP TABLE IF EXISTS COMP_CONTACTS", [], function (tx, result) { 
         console.log('clear comp_contact')    
      }, errorCB);})
    db.transaction(function dumb4(tx,result){tx.executeSql("DROP TABLE IF EXISTS COMP_PHONES", [], function (tx, result) { 
        console.log('clear comp_phone')    
    }, errorCB);  })
    db.transaction(function dumb5(tx,result){tx.executeSql("DROP TABLE IF EXISTS COMP_PH_LABELS", [], function (tx, result) {  
        console.log('clear comp_ph_label')    
    }, errorCB); }) 
    db.transaction(function dumb6 (tx,result){tx.executeSql("DROP TABLE IF EXISTS SCREENINGS", [], function (tx, result) { 
         console.log('clear screenings')    
    }, errorCB);})
    $('#screening-list').remove()  
    $('#screening-list').listview("refresh");
}
  
function createTables(tx){
    console.log('Loading new festival - festID: '+fest)
    var d = new Date();
    var timestamp = parseInt(d.getTime()/1000);
    //alert('First Run!  Set up tables - Date: '+ timestamp) 
    console.log('Dropping old tables, if any....')
    tx.executeSql('DROP TABLE IF EXISTS FILMS'); 
    tx.executeSql('DROP TABLE IF EXISTS COMP');
    tx.executeSql('DROP TABLE IF EXISTS COMP_CONTACT');
    tx.executeSql('DROP TABLE IF EXISTS COMP_PHONE');
    tx.executeSql('DROP TABLE IF EXISTS COMP_PH_LABEL');
    tx.executeSql('DROP TABLE IF EXISTS SCREENINGS'); 
    tx.executeSql('DROP TABLE IF EXISTS ACCESS_LOG');
    
    console.log('Creating new tables.....')
    tx.executeSql('CREATE TABLE IF NOT EXISTS ACCESS_LOG (id unique, data, fest)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS FILMS (id unique,nid, title, director, status, genre, budget,\
        cvgexists,addl_avails,tracking, all_pass, logline, notes, script_log, film_list, script_fid, screenings,\
        language, mirjam_read, coverage, salesco_nid, greece,greece_notes,italy,italy_notes,benelux,benelux_notes,\
        philippenes,philippenes_notes,indonesia,indonesia_notes,cis,cis_notes,airline,airline_notes,\
        mideast,mideast_notes,spain,spain_notes,uk,uk_notes,latinamer,latinamer_notes,france,france_notes,\
        switzerland,switzerland_notes,scandinavia,scandinavia_notes, writers, producers, casting, my_fave, abc, type,\
	    australia, australia_notes, all_sold,section)'); 
    tx.executeSql('CREATE TABLE IF NOT EXISTS COMPS (id unique,nid, name, addr,lineup)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS COMP_CONTACTS (id unique, nid, delta, contact)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS COMP_PHONES (id unique,nid, delta, phone)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS COMP_PH_LABELS (id unique,nid,delta,label)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS SCREENINGS (id unique,nid,datetime,dateonly,venue,room,type)');
    tx.executeSql('INSERT INTO ACCESS_LOG (id, data, fest) VALUES (?, ?,?)',["1", timestamp, fest]);
}

function populateFilms(tx) {  
    createTables(tx);
    console.log('Getting film data from server')
    
    // Check to make sure phone's database is working and table was created
    tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name='FILMS'", [], function (tx, result) {
          if (result.rows.length == 0) {
              alert('Films Table Not Found')
          }
      });
        
      //$.mobile.changePage("#m_loading", { transition: "slide"} );    
      $.mobile.loading( "show", {
        text: "Loading film database....",
        textVisible: true,
        theme: "a",
        html: ""
      });
      
      $.support.cors = true;
      $.mobile.allowCrossDomainPages = true;
      
      $.ajax({
        type: 'POST',
        dataType : 'json',
        cache: false,
        crossDomain: true,
        url: 'http://www.orange-ent.net/m_get_current_film_dump',
        error: function(err){alert('Error getting film dump')},
        success: function(obj){
                data_str = JSON.stringify(obj);   
                films = JSON.parse(data_str);
                film_count = films.length + 1;
                console.log("Loaded " + (film_count-1) + ' films into the film database')
                db.transaction(fillFilms, errorCB, function(){db.transaction(populateComps);});
                //alert('back')
            }
        });
}

function getUpdatedFilmData(tx){
    // Send request with last updated date
    tx.executeSql("SELECT * FROM ACCESS_LOG", [], function (tx, results) {
        dte = parseInt(results.rows.item(0).data)
        console.log('Get updated film values after ' + dte)     
        
        $.mobile.loading( "show", {
          text: "Updating film database....",
          textVisible: true,
          theme: "a",
          html: ""
        });  
        $('h1').css('font-color: white')
        
    
        $.support.cors = true;
        $.mobile.allowCrossDomainPages = true;
    
        $.ajax({
          type: 'GET',
          dataType : 'json',
          cache: false,
          crossDomain: true,
          url: 'http://www.orange-ent.net/m_get_current_film_dump/?dte='+dte,
          error: function(err){alert('Error getting film dump')},
          success: function(obj){
                  data_str = JSON.stringify(obj);   
                  films = JSON.parse(data_str);
                  console.log('Films to update: ' + films.length)
                  db.transaction(updateFilms, errorCB, function(){db.transaction(getUpdatedCompData);});
                  //alert('back')
              }
          });
    })   
}

function populateComps(tx){
       $('ui-icon-loading').find('h1').html('Loading Companies...')
       tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name='COMPS'", [], function (tx, result) {
              if (result.rows.length == 0) {
                  alert('Comps Table Not Found')
              }
          }, errorCB);
          
        $.ajax({
          type: 'GET',    
          dataType : 'json',
          cache: false,
          crossDomain: true,
          url: 'http://www.orange-ent.net/m_get_current_comp_dump',
          error: function(jqXHR, txtStatus, errorThrown){
                  alert('Error! | ' + jqXHR.responseText + ' | ' + txtStatus + ' | ' +errorThrown + ' | ');
              },
          success: function(obj){
                  //alert('Comps loaded')
                  data_str = JSON.stringify(obj);   //<---- there must be a way to combine these two lines into one?
                  comps = JSON.parse(data_str);
                  comp_count = comps.length + 1;
                  console.log("Loaded " + (comp_count-1) + ' comps into the comps database')
                  db.transaction(fillComps, errorCB, function(){db.transaction(populateCompContacts);});
              }
          });
}

function getUpdatedCompData(tx){
    $('div.ui-loader-verbose h1').html('Updating Companies...')
    $.support.cors = true;
    $.mobile.allowCrossDomainPages = true;
    console.log(dte)
    $.ajax({
      type: 'GET',
      dataType : 'json',
      cache: false,
      crossDomain: true,
      url: 'http://www.orange-ent.net/m_get_current_comp_dump/?dte='+dte,
      error: function(err){alert('Error getting comp dump')},
      success: function(obj){
              data_str = JSON.stringify(obj);   
              comps = JSON.parse(data_str);
              console.log('Comps to update: ' + comps.length)
              db.transaction(updateComps, errorCB, function(){db.transaction(getUpdatedCompContactsData);});
              //alert('back')
          }
      });
}

function populateCompContacts(tx){
         tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name='COMP_CONTACTS'", [], function (tx, result) {
                if (result.rows.length == 0) {
                    alert('Comp_Contact Table Not Found')
                }
            });

          $.ajax({
            type: 'GET',
            dataType : 'json',
            cache: false,
            crossDomain: true,
            url: 'http://www.orange-ent.net/m_get_current_comp_contact_dump',
            error: function(jqXHR, txtStatus, errorThrown){
                    alert('Error! | ' + jqXHR.responseText + ' | ' + txtStatus + ' | ' +errorThrown + ' | ');
                },
            success: function(obj){
                    data_str = JSON.stringify(obj);   //<---- there must be a way to combine these two lines into one?
                    comp_contacts = JSON.parse(data_str);
                    comp_contact_count = comp_contacts.length + 1;
                    console.log("Loaded " + (comp_contact_count-1) + ' comp_contacts into the comp_contacts database')
                    db.transaction(fillCompContacts, errorCBfillCompContacts, function(){db.transaction(populateCompPhones);});
                }
            });
}

function getUpdatedCompContactsData(tx){
    //$('div.ui-loader-verbose h1').html('Updating Company Contacts...')
    $.support.cors = true;
    $.mobile.allowCrossDomainPages = true;

    $.ajax({
      type: 'GET',
      dataType : 'json',
      cache: false,
      crossDomain: true,
      url: 'http://www.orange-ent.net/m_get_current_comp_contact_dump/?dte='+dte,
      error: function(err){alert('Error getting comp contact dump')},
      success: function(obj){
              data_str = JSON.stringify(obj);   
              comp_contacts = JSON.parse(data_str);
              console.log('Comp contacts to update: ' + comp_contacts.length)
              db.transaction(updateCompContacts, errorCB, function(){db.transaction(getUpdatedCompPhonesData);});
              //alert('back')
          }
      });
    
}

function populateCompPhones(tx){
            tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name='COMP_PHONES'", [], function (tx, result) {
                  if (result.rows.length == 0) {
                      alert('Comp_Phone Table Not Found')
                  }
              });

            $.ajax({
              type: 'GET',
              dataType : 'json',
              cache: false,
              crossDomain: true,
              url: 'http://www.orange-ent.net/m_get_current_comp_phone_dump',
              error: function(jqXHR, txtStatus, errorThrown){
                      alert('Error! | ' + jqXHR.responseText + ' | ' + txtStatus + ' | ' +errorThrown + ' | ');
                  },
              success: function(obj){
                      //alert('Comp Phones loaded')
                      data_str = JSON.stringify(obj);   //<---- there must be a way to combine these two lines into one?
                      comp_phones = JSON.parse(data_str);
                      comp_phone_count = comp_phones.length + 1;
                      console.log("Loaded " + (comp_phone_count-1) + ' comp_phones into the comp_phone database')
                      db.transaction(fillCompPhones, errorCB, function(){db.transaction(populateCompPhLabels);});
                  }
              });
}

function getUpdatedCompPhonesData(tx){
    //$('div.ui-loader-verbose h1').html('Updating Company Phones...')
    $.support.cors = true;
    $.mobile.allowCrossDomainPages = true;

    $.ajax({
      type: 'GET',
      dataType : 'json',
      cache: false,
      crossDomain: true,
      url: 'http://www.orange-ent.net/m_get_current_comp_phone_dump/?dte='+dte,
      error: function(err){alert('Error getting comp phone dump')},
      success: function(obj){
              data_str = JSON.stringify(obj);   
              comp_phones = JSON.parse(data_str);
              console.log('Comp phones to update: ' + comp_phones.length)
              db.transaction(updateCompPhones, errorCB, function(){db.transaction(getUpdatedCompPhLabelsData);});
              //alert('back')
          }
      });
    
}

function populateCompPhLabels(tx){  
              tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name='COMP_PH_LABELS'", [], function (tx, result) {
                    if (result.rows.length == 0) {
                        alert('Comp_Ph_Label Table Not Found')
                    }
                });

              $.ajax({
                type: 'GET',
                dataType : 'json',
                cache: false,
                crossDomain: true,
                url: 'http://www.orange-ent.net/m_get_current_comp_ph_label_dump',
                error: function(jqXHR, txtStatus, errorThrown){
                        alert('Error! | ' + jqXHR.responseText + ' | ' + txtStatus + ' | ' +errorThrown + ' | ');
                    },
                success: function(obj){
                        //alert('Comp Ph Labels loaded')
                        data_str = JSON.stringify(obj);   //<---- there must be a way to combine these two lines into one?
                        comp_ph_labels = JSON.parse(data_str);
                        comp_ph_label_count = comp_ph_labels.length+1;
                        console.log("Loaded " + (comp_ph_label_count-1) + ' comp_ph_labels into the comp_ph_label database')
                        db.transaction(fillCompPhLabels, errorCB, function(){db.transaction(populateScreenings);});
                    }
                });
}

function getUpdatedCompPhLabelsData(tx){
    //$('div.ui-loader-verbose h1').html('Updating Company Phone Labels...')
    $.support.cors = true;
    $.mobile.allowCrossDomainPages = true;

    $.ajax({
      type: 'GET',
      dataType : 'json',
      cache: false,
      crossDomain: true,
      url: 'http://www.orange-ent.net/m_get_current_comp_ph_label_dump/?dte='+dte,
      error: function(err){alert('Error getting comp ph label dump')},
      success: function(obj){
              data_str = JSON.stringify(obj);   
              comp_ph_labels = JSON.parse(data_str);
              console.log('Comp ph labels to update: ' + comp_ph_labels.length)
              db.transaction(updateCompPhLabels, errorCB, function(){db.transaction(getUpdatedScreeningsData);});
              //alert('back')
          }
      });
}

function populateScreenings(tx){
    $('div.ui-loader-verbose h1').html('Loading Screening Data...')
    tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name='SCREENINGS'", [], function (tx, result) {
          if (result.rows.length == 0) {
              alert('Comp_Ph_Label Table Not Found')
          }
      });

    $.ajax({
      type: 'GET',
      dataType : 'json',
      cache: false,
      crossDomain: true,
      url: 'http://www.orange-ent.net/m_get_screenings_list',
      error: function(jqXHR, txtStatus, errorThrown){
              alert('Error! | ' + jqXHR.responseText + ' | ' + txtStatus + ' | ' +errorThrown + ' | ');
          },
      success: function(obj){
              //alert('Comp Ph Labels loaded')
              data_str = JSON.stringify(obj);   //<---- there must be a way to combine these two lines into one?
              screenings = JSON.parse(data_str);
              screening_count = screenings.length + 1;
              console.log("Loaded " + (screening_count-1) + ' screenings into the screening database')
              db.transaction(fillScreenings, errorCB);
          }
      });
}

function getUpdatedScreeningsData(tx){
    $('div.ui-loader-verbose h1').html('Update Screening Data...')
    $.support.cors = true;
    $.mobile.allowCrossDomainPages = true;

    $.ajax({
      type: 'GET',
      dataType : 'json',
      cache: false,
      crossDomain: true,
      url: 'http://www.orange-ent.net/m_get_screenings_list/?dte='+dte,
      error: function(err){alert('Error getting screenings dump')},
      success: function(obj){
              data_str = JSON.stringify(obj);   
              screenings = JSON.parse(data_str);
              console.log('Screenings to update: ' + screenings.length)
              db.transaction(updateScreenings, errorCB)
            }
      }); 
}

function fillFilms(tx){
    var count = initial_id; 
    for (var key in films) {   
         tx.executeSql('INSERT INTO FILMS (id, nid, title, director, status, genre, budget,cvgexists,addl_avails,tracking, all_pass,\
             logline, notes, script_log, film_list, script_fid, screenings,language, mirjam_read, coverage, salesco_nid,\
             greece,greece_notes,italy,italy_notes,benelux,benelux_notes,philippenes,philippenes_notes,indonesia,indonesia_notes,\
             cis,cis_notes,airline,airline_notes,mideast,mideast_notes,spain,spain_notes,uk,uk_notes,latinamer,latinamer_notes,\
             france,france_notes,switzerland,switzerland_notes,scandinavia,scandinavia_notes, writers, producers, casting, my_fave, abc,type,\
		     australia, australia_notes, all_sold, section) \
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[count, films[key][0],
             films[key][1], films[key][2], films[key][3], films[key][6], films[key][7], films[key][8], films[key][9],
             films[key][11], films[key][12], films[key][4], films[key][5], films[key][13], films[key][14], films[key][15],
             films[key][16], films[key][17], films[key][18], films[key][10], films[key][19],films[key][20], films[key][21], 
             films[key][22], films[key][23], films[key][24], films[key][25], films[key][26],films[key][27], films[key][28], 
             films[key][29], films[key][30], films[key][31], films[key][32], films[key][33],films[key][34], films[key][35], 
             films[key][36], films[key][37], films[key][38], films[key][39], films[key][40],films[key][41], films[key][42], 
             films[key][43], films[key][44], films[key][45], films[key][46], films[key][47],films[key][48], films[key][49], 
             films[key][50], "", films[key][51], films[key][52], films[key][54],films[key][55],films[key][56],films[key][57]]);  
         count++;
     }   
}

function updateFilms(tx){
    // films[] has update data.  First delete all of the existing version of updated nodes
    var count = 0;
    console.log('films length '+films.length)
    for (var key in films) {
         console.log('Delete NID: ' + films[count][0])
         // this code gets the id of the deleted item - not presently used but could be used to make a list of nodes to replace
         // instead of using new id #s
         /*tx.executeSql("SELECT * FROM FILMS WHERE nid = '" + films[count][0]+"'", [], function (tx, result) {
            delete_id = result.rows.item(0).id 
            console.log('Delete id: ' + delete_id)    
          }, errorCB);*/

         tx.executeSql('DELETE FROM FILMS WHERE nid = "' + films[count][0] + '"');  
         count++;
     }
     console.log('Films - ' + count + " | Current film count: " + film_count)
     tx.executeSql("SELECT * FROM FILMS ORDER BY id DESC", [], function (tx, results) {
         initial_id = results.rows.item(0).id + 1
     //alert('Max: ' + initial_id)  
     film_count += count;
      //alert('Initial ID: ' + initial_id + " | film_count: " + film_count)
     fillFilms(tx)
 })   
}

function fillComps(tx){
    var count = initial_id;
    var str = '';
    for (var key in comps) {
         tx.executeSql('INSERT INTO COMPS (id, nid, name, addr, lineup) VALUES (?,?,?,?,?)',
         [count, comps[key][0],comps[key][1],comps[key][2],comps[key][3] ]); 
         count++;
    }
}

function updateComps(tx){
    // films[] has update data.  First delete all of the existing version of updated nodes
    var count = 0;
    for (var key in comps) {
         console.log('Delete NID: ' + comps[count][0])
         tx.executeSql('DELETE FROM COMPS WHERE nid = "' + comps[count][0]+'"');  
         count++;
     }
     console.log('Comps - ' + count) 
     tx.executeSql("SELECT * FROM COMPS ORDER BY id DESC", [], function (tx, results) { 
         console.log('Max comp id: ' + results.rows.length)
         initial_id = (results.rows.length > 0?results.rows.item(0).id + 1:0)
     //alert('Max: ' + initial_id)  
     comp_count += count;
     fillComps(tx)  
  })
}

function fillCompContacts(tx){
    var count = initial_id;
    var str = '';
    for (var key in comp_contacts) {
         tx.executeSql('INSERT INTO COMP_CONTACTS (id, nid, delta, contact) VALUES (?,?,?,?)',
         [count, comp_contacts[key][0],comp_contacts[key][1], comp_contacts[key][2]]); 
         count++;
    }
}

function updateCompContacts(tx){
    var count = 0;
    for (var key in comp_contacts) {
         console.log('Delete NID: ' + comp_contacts[count][0])
         tx.executeSql('DELETE FROM COMP_CONTACTS WHERE nid = "' + comp_contacts[count][0]+'"');  
         count++;
     }
     console.log('Comp Contacts ' + count)
     tx.executeSql("SELECT * FROM COMP_CONTACTS ORDER BY id DESC", [], function (tx, results) {
         initial_id = results.rows.item(0).id + 1
     comp_contact_count += count;
     fillCompContacts(tx)
 })
}

function fillCompPhones(tx){
    var count = initial_id;
    var str = '';
    for (var key in comp_phones) {
         tx.executeSql('INSERT INTO COMP_PHONES (id, nid, delta, phone) VALUES (?,?,?,?)',
         [count, comp_phones[key][0],comp_phones[key][1], comp_phones[key][2]]); 
         count++;
    }
}

function updateCompPhones(tx){
    // films[] has update data.  First delete all of the existing version of updated nodes
    var count = 0;
    for (var key in comp_phones) {
         console.log('Delete NID: ' + comp_phones[count][0])
         tx.executeSql('DELETE FROM COMP_PHONES WHERE nid = "' + comp_phones[count][0]+'"');  
         count++;
     }
     console.log('Comp Phones - ' + count)
     tx.executeSql("SELECT * FROM COMP_PHONES ORDER BY id DESC", [], function (tx, results) {
         initial_id = results.rows.item(0).id + 1
     comp_phone_count += count;
     fillCompPhones(tx)
 })
}

function fillCompPhLabels(tx){
    var count = initial_id;
    var str = '';
    for (var key in comp_ph_labels) {
         tx.executeSql('INSERT INTO COMP_PH_LABELS (id, nid, delta, label) VALUES (?,?,?,?)',
         [count, comp_ph_labels[key][0],comp_ph_labels[key][1], comp_ph_labels[key][2]]); 
         count++;
    }
}

function updateCompPhLabels(tx){
    var count = 0;
    for (var key in comp_ph_labels) {
         console.log('Delete NID: ' + comp_ph_labels[count][0])
         tx.executeSql('DELETE FROM COMP_PH_LABELS WHERE nid = "' + comp_ph_labels[count][0]+'"');  
         count++;
     }
     console.log('Comp Ph Labels - ' + count)
     tx.executeSql("SELECT * FROM COMP_PH_LABELS ORDER BY id DESC", [], function (tx, results) {
         initial_id = results.rows.item(0).id + 1
     comp_ph_label_count += count;
     fillCompPhLabels(tx)
 })
}

function fillScreenings(tx){
    var count = initial_id;
    var str = '';
    for (var key in screenings) {
		dateonly = (screenings[key][1]).substring(0,11)
         tx.executeSql('INSERT INTO SCREENINGS (id,nid,datetime,dateonly,venue,room,type) VALUES (?,?,?,?,?,?,?)',
         [count, screenings[key][0],screenings[key][1], dateonly, screenings[key][2],screenings[key][3],screenings[key][4]]); 
         count++;
    }

    $.mobile.changePage("#m_springboard", { transition: "slide"} ); 
    $.mobile.loading( "hide", {
      text: "Loading film database....",
      textVisible: true,
      theme: "a",
      html: ""
    });
}

function updateScreenings(tx){
    var count = 0;
    for (var key in screenings) {
         console.log('Delete NID: ' + screenings[count][0])
         tx.executeSql('DELETE FROM SCREENINGS WHERE nid = "' + screenings[count][0]+'"');  
         count++;
     }
     console.log('Screenings - ' + count)  
     tx.executeSql("SELECT * FROM SCREENINGS ORDER BY id DESC", [], function (tx, results) { 
          console.log('Max comp id: ' + results.rows.length)
          initial_id = (results.rows.length > 0?results.rows.item(0).id + 1:0)
      //alert('Max: ' + initial_id)  

         screening_count += count;
         var d = new Date();
         var timestamp = parseInt(d.getTime()/1000);
         tx.executeSql('UPDATE ACCESS_LOG SET data = "'+ timestamp + '" WHERE id=1');
         fillScreenings(tx)
         $.mobile.loading( "hide", {
           text: "Updating film database....",
           textVisible: true,
           theme: "a",
           html: ""   
     });  
  })   
}

function getTableLengths(tx){    
    console.log('Getting table lengths')
    tx.executeSql("SELECT * FROM FILMS", [], function (tx, result) {
        film_count = result.rows.length 
        console.log('film_count: ' + film_count)    
      }, errorCB);
    tx.executeSql("SELECT * FROM COMPS", [], function (tx, result) {
        comp_count = result.rows.length 
        console.log('comp_count: ' + comp_count) 
    }, errorCB);  
    tx.executeSql("SELECT * FROM COMP_CONTACTS", [], function (tx, result) {
         comp_contact_count = result.rows.length 
         console.log('comp_contact_count: ' + comp_contact_count)    
      }, errorCB);
    tx.executeSql("SELECT * FROM COMP_PHONES", [], function (tx, result) {
        comp_phone_count = result.rows.length 
        console.log('comp_phone_count: ' + comp_phone_count)    
    }, errorCB);
    tx.executeSql("SELECT * FROM COMP_PH_LABELS", [], function (tx, result) {
        comp_ph_label_count = result.rows.length 
        console.log('comp_ph_label_count: ' + comp_ph_label_count)    
    }, errorCB);  
    tx.executeSql("SELECT * FROM SCREENINGS", [], function (tx, result) {
        screening_count = result.rows.length 
        console.log('screening_count: ' + screening_count)    
    }, errorCB);
    //$.mobile.changePage("#m_springboard", { transition: "slide"} );   
}

function errorCB(err) {
    alert("Error processing SQL: "+err.code + err.message);
}

function errorCBfillCompContacts(err){
    alert("Error processing SQL from fillCompContacts: "+err.code);
}

function renderFilmList(tx, results){
    console.log('Render film list - '+results.rows.length+' rows.')
        $('the-list').remove()
        str = "";
        comp = '';
        section = '';
        for (var i = 0; i<results.rows.length; i++)
        {
            if (order_by_salesco == 1 && results.rows.item(i).name != comp)
            {
                str += "<li nid='" + results.rows.item(i).comp_nid + "' data-role='list-divider' data-divider-theme='a' class='comp'>" + 
                (results.rows.item(i).name===null?"No Sales Company":results.rows.item(i).name) + "</li>";
                comp = results.rows.item(i).name;
    
            }
            else
            {
                if (order_by_section == 1 && results.rows.item(i).section != section)
                {
                    str += "<li data-role='list-divider' data-divider-theme='a' class='section'>" + (results.rows.item(i).section===null?'No Info':results.rows.item(i).section) + "</li>";
                    section = results.rows.item(i).section;
                }
            }
            str += "<li nid=" + results.rows.item(i).nid + " class='film'><a href='#' class='ui-link'>" + results.rows.item(i).title + 
                (results.rows.item(i).name === null?'':'<span class="salesco-name"> (' + results.rows.item(i).name) + ")</span></a></li>";
        }
        $('#the-list').html(str);      
        if (first_run == 1)
        {
            first_run = 0    
            $('#the-list').trigger('create') 

        }
        else
        {
            $('#the-list').listview("refresh");
        }

    $.mobile.changePage("#m_film_list", { transition: "slide"} );
    order_by_salesco = 0;
    order_by_section = 0;
}

function renderFilmDetail(tx, results){  
    var star3 = (results.rows.item(0).my_fave > 0?"&#9733":"&#9734")
    var star2 = (results.rows.item(0).my_fave > 1?"&#9733":"&#9734")
    var star1 = (results.rows.item(0).my_fave > 2?"&#9733":"&#9734")
    
    // If this is a search result, highlight search term in red
    var regEx = new RegExp("("+search_string+")", "ig"); 
    var title = (results.rows.item(0).title===null?'':results.rows.item(0).title.replace(regEx,'<span class="hilite">$1</span>'))  
    
    var regEx = new RegExp("("+search_string+")", "ig");
    var director = (results.rows.item(0).director===null?'':results.rows.item(0).director.replace(regEx,'<span class="hilite">$1</span>'))  
    
    var regEx = new RegExp("("+search_string+")", "ig");
    var writers = (results.rows.item(0).writers===null?'':results.rows.item(0).writers.replace(regEx,'<span class="hilite">$1</span>')) 
    
    var regEx = new RegExp("("+search_string+")", "ig");
    var producers = (results.rows.item(0).producers===null?'':results.rows.item(0).producers.replace(regEx,'<span class="hilite">$1</span>')) 
    
    var regEx = new RegExp("("+search_string+")", "ig");
    var casting = (results.rows.item(0).casting===null?'':results.rows.item(0).casting.replace(regEx,'<span class="hilite">$1</span>'))
	
	if(results.rows.item(0).all_sold == 'Not All Sold' && results.rows.item(0).airline == 'Not Airline' && 
		results.rows.item(0).australia == 'Not Australia' && results.rows.item(0).benelux == 'Not Benelux' &&  
		results.rows.item(0).greece == 'Not Greece' && results.rows.item(0).indonesia == 'Not Indonesia' &&
		results.rows.item(0).italy == 'Not Italy' && results.rows.item(0).latinamer == 'Not Latin America' && results.rows.item(0).mideast == 'Not Middle East' && 
		results.rows.item(0).scandinavia == 'Not Scandinavia' &&
		results.rows.item(0).spain == 'Not Spain' && results.rows.item(0).switzerland == 'Not Switzerland' && results.rows.item(0).uk == 'Not UK')
	{
		var no_info="no info";
	}
	else
	{
		var no_info = 'info';
	}
	
	var rating = "None"
	switch (results.rows.item(0).abc){
		case "1":
			rating="A"
			break;
		case "2":
			rating="B"
			break;
		case "3":
			rating="C"
			break;
		case "4":
			rating = "Pass"
			break;
	}
    
    var str = '<div id="film-info"></br></br></br>' +
        '<div class="fave" nid = "' + results.rows.item(0).nid + '"><span id="star-3" class="star">'+star1+'</span><span id="star-2" class="star">'+star2+'</span><span id="star-1" class="star">'+star3+'</span></div>' +
        '</br></br>Title: ' + title + 
        '</br>Sales Company: ' + results.rows.item(0).name + '</br>' +
        '<div data-role="collapsable-set" data-theme="a">' +
        '<div data-role="collapsible" data-collapsed="true" data-theme="a" data-content-theme="b"><h3>Details</h3>' +
        'Status: ' + (results.rows.item(0).status===null?'':results.rows.item(0).status) + '</br>' +
        'Rating: ' + rating + '</br>' +
        'Genre: ' + (results.rows.item(0).genre===null?'':results.rows.item(0).genre) + '</br>' +
        'Language: ' + (results.rows.item(0).language===null?'':results.rows.item(0).language) + '</br>' +
        'Cast: ' + casting + '</br>' +
        'Director: ' + director + '</br>' +
        'Writer(s): ' + writers + '</br>' +
        'Producer(s): ' + producers  + '</div>' +
        (results.rows.item(0).logline===null?'':'<div data-role="collapsible" data-collapsed="true" data-theme="a" data-content-theme="b"><h3>Logline</h3>' + 
        results.rows.item(0).logline + '</div>') +
        (results.rows.item(0).notes=== null?'':'<div data-role="collapsible" data-collapsed="true" data-theme="a" data-content-theme="b"><h3>Notes</h3>' + 
        results.rows.item(0).notes + '</div>') +
        (results.rows.item(0).coverage===null?'':'<div data-role="collapsible" data-collapsed="true" data-theme="a" data-content-theme="b"><h3>Coverage</h3>' + 
        results.rows.item(0).coverage + '</div>')+
        '<div data-role="collapsible" data-collapsed="true" data-theme="a" data-content-theme="b"><h3>Avails</h3>' + 
		(results.rows.item(0).all_sold == 'All Sold'?'All Sold':(no_info == 'no info'?"No Information":
        'Airline: ' + (results.rows.item(0).airline == 'Not Airline'?'Not Available':(results.rows.item(0).airline_notes===null?"Available":results.rows.item(0).airline_notes)) + "</br>" +
        'Australia: ' + (results.rows.item(0).australia == 'Not Australia'?'Not Available':(results.rows.item(0).australia_notes===null?"Available":results.rows.item(0).australia_notes)) + "</br>" +
        'Benelux: ' + (results.rows.item(0).benelux == 'Not Benelux'?'Not Available':(results.rows.item(0).benelux_notes===null?"Available":results.rows.item(0).benelux_notes)) +  "</br>" +
        'Greece: ' + (results.rows.item(0).greece == 'Not Greece'?'Not Available':(results.rows.item(0).greece_notes===null?"Available":results.rows.item(0).greece_notes)) + "</br>" +
        'Indonesia: ' + (results.rows.item(0).indonesia == 'Not Indonesia'?'Not Available':(results.rows.item(0).indonesia_notes===null?"Available":results.rows.item(0).indonesia_notes)) + "</br>" +
        'Italy: ' + (results.rows.item(0).italy == 'Not Italy'?'Not Available':(results.rows.item(0).italy_notes===null?"Available":results.rows.item(0).italy_notes)) + "</br>" +
        'Latin America: ' + (results.rows.item(0).latinamer == 'Not Latin America'?'Not Available':(results.rows.item(0).latinamer_notes===null?"Available":results.rows.item(0).latinamer_notes)) + "</br>" +
        'Middle East: ' + (results.rows.item(0).mideast == 'Not Middle East'?'Not Available':(results.rows.item(0).mideast_notes===null?"Available":results.rows.item(0).mideast_notes)) + "</br>" +
        'Scandinavia: ' + (results.rows.item(0).scandinavia == 'Not Scandinavia'?'Not Available':(results.rows.item(0).scandinavia_notes===null?"Available":results.rows.item(0).scandinavia_notes)) + "</br>" +
        'Spain: ' + (results.rows.item(0).spain == 'Not Spain'?'Not Available':(results.rows.item(0).spain_notes===null?"Available":results.rows.item(0).spain_notes)) + "</br>" +
        'Switzerland: ' + (results.rows.item(0).switzerland == 'Not Switzerland'?'Not Available':(results.rows.item(0).switzerland_notes===null?"Available":results.rows.item(0).switzerland_notes)) + "</br>" +
        'UK: ' + (results.rows.item(0).uk == 'Not UK'?'Not Available':(results.rows.item(0).uk_notes===null?"Available":results.rows.item(0).uk_notes)))
		) + "</div>" +
        (results.rows.item(0).script_fid===null?'':'<div data-role="collapsible" data-collapsed="true" data-theme="a" data-content-theme="b"><h3>Script</h3>\
        <a href="#" style="height: 100px" id="script_link" url="http://www.orange-ent.net/'+results.rows.item(0).script_fid+'">Script</a></div>')
        
        tx.executeSql("SELECT * FROM SCREENINGS WHERE nid='" + results.rows.item(0).nid +"' ORDER BY datetime", [], function (tx, results) {
            if(results.rows.length > 0){
               str += '<div data-role="collapsible" data-collapsed="true" data-theme="a" data-content-theme="b"><h3>Screenings</h3>'
               for (var i = 0; i<results.rows.length; i++)
               {
                   str += getDateStringNoDOW(results.rows.item(i).datetime) + (results.rows.item(i).venue != null?" | "+results.rows.item(i).venue:'') + 
				   (results.rows.item(i).room != null?" | "+ results.rows.item(i).room:'') + "</br>"
               }
               str += "</div>"
            } 
            str += '</div></div>'   

            $('#m_film_detail_results').html(str);
            $('#m_film_detail_results').trigger('create');
            $.mobile.changePage("#m_film_detail", { transition: "slide"} );
          }, errorCB);
}

function renderCompList(tx, results){
    if ($('#the-comp-list').html() == ''){
        str = "";
        for (var i = 0; i<results.rows.length; i++){
            str += "<li class = 'comp' nid=" + results.rows.item(i).nid + "><a href='#' class='ui-link'>" + results.rows.item(i).name + "</a></li>";
        }
        $('#the-comp-list').html(str);      
        if (first_run_comp == 1){
            first_run_comp = 0
        }
        else
        {
            $('#the-comp-list').listview("refresh");
        }
    }
    else
    {
       $('#the-comp-list').trigger('create') 
       $('#the-comp-list').listview("refresh");  
    }
    $.mobile.changePage("#m_comp_list", { transition: "slide"} );
}

function renderCompDetail(tx, results){    
    str = '<div id="comp-info" </br></br>' +
    comp_name + '</br>' +
    (comp_addr === null?'':comp_addr) + '</br>' +
	"<div data-role='controlgroup' data-type='horizontal'>\
      <a href='#' data-role='button' id='projects-btn' class='ui-btn-active ui-state-persist'>Films</a>\
      <a href='#' data-role='button' id='contacts-btn' class='ui-btn-inactive'>Contacts</a>"+
      (results.rows.item(0).lineup===null || results.rows.item(0).lineup==''?'':"<a href='#' data-role='button' id='lineup-btn' class='ui-btn-inactive' url='"+results.rows.item(0).lineup+"'>Line-Up</a>")+
      "</div></br><div id='comp-list-results'>"
    var c = 0
    if (contacts == 1)
    {
        for (var i = 0; i<results.rows.length; i++){
            if (results.rows.item(i).label != null){
                c++;
                if (c==1){str+="<ul data-role='listview' data-theme='c' id='contact-list'>"}
                str += "<li class = 'comp-contact' nid=" + results.rows.item(i).bnid + "> \
                <span class='left'>" + results.rows.item(i).label + "</span><span class='right'>" + results.rows.item(i).phone + "</span></li>";
            }
        }
        if (c==0)
        {
            str += '<p>There are no contacts available for this company.</p></div></div>'
        }
        else
        {
            str += "</ul>" 
        }
    }
        else // contacts = 0
    {
        for (var i = 0; i<results.rows.length; i++){
            if (results.rows.item(i).title != null){
                c++;
                if (c==1){str+="<div id='comps-list'><ul data-role='listview' data-theme='c' id='film-list'>"}
                str += "<li class = 'film' nid=" + results.rows.item(i).bnid + "><a href='#' class='ui-link'>" + results.rows.item(i).title + "</a></li>";
            }
        }
        if (c==0)
        {
            str += '<p>There are no projects available for this company.</p></div></div>'
        }
        else
        {
            str += "</ul></div></div>" 
        }
     }

    $('#m_comp_detail_results').html(str);
    $('#m_comp_detail_results').trigger('create');
    $.mobile.changePage("#m_comp_detail", { transition: "slide"} ); 
}

function renderCompContactList(tx, results){
    var c = 0, str = '';
    //alert('comp contact list '+results.rows.length )
    for (var i = 0; i<results.rows.length; i++){
        if (results.rows.item(i).label != null){
            if (c==0){str+="<ul data-role='listview' data-theme='c' id='comp-contact-list'>"}
            str += "<li class = 'comp' nid=" + results.rows.item(i).bnid + "><span class='left'>" + 
            results.rows.item(i).label + "</span><span class='right'>" + results.rows.item(i).phone + "</span></li>";
            c++;
        }
    }
    if (c==0)
    {
        $('#comp-list-results').html('<p>There are no contacts available for this company.</p>')
    }
    else
    {
        str +="</ul>";
        $('#comp-list-results').html(str);
        $('#comp-list-results').trigger('create')
    }
}

function renderCompFilmList(tx, results){
    var c = 0, str = '';
    for (var i = 0; i < results.rows.length; i++){
        if (results.rows.item(i).title != null){
            if (c==0){str+="<ul data-role='listview' data-theme='c' id='comp-film-list'>"}
            str += "<li class = 'comp' nid=" + results.rows.item(i).nid + "><a href='#' class='ui-link'>" + results.rows.item(i).title + "</a></li>";
            c++;
        }
    }
    if (c==0)
    {
        $('#comp-list-results').html('<p>There are no projects available for this company.</p>')
    }
    else
    {
        str +="</ul>";
        $('#comp-list-results').html(str);
        $('#comp-list-results').trigger('create')
    }
}

function renderAllABCList(tx, results){
    var title
        str = "<ul data-role='listview' data-theme='c' id='all-abc-list' data-filter='true' data-input='filterBasic-input' data-filter-placeholder='Search....'>";
        status = '';
        abc = '';
        for (var i = 0; i<results.rows.length; i++)
        {
                if (results.rows.item(i).status != status && results.rows.item(i).abc != abc)
                {
                    if (results.rows.item(i).status != "Completed"){title = 'Project ('+status+ " | " + abc+")"}else{title = "Complete("+status+ " | "+abc+")"}
                    if (results.rows.item(i).status != "Completed" && results.rows.item(i).abc == "1"){title += " - Recommend" }
                    if (results.rows.item(i).status != "Completed" && results.rows.item(i).abc == "2"){title += " - Strong Consider" }
                    if (results.rows.item(i).status != "Completed" && results.rows.item(i).abc == "3"){title += " - Consider" }
                    if (results.rows.item(i).status != "Completed" && results.rows.item(i).abc == "4"){title += " - Weak Consider" }
                    if (results.rows.item(i).status != "Completed" && results.rows.item(i).abc == "5"){title += " - Wait See" }
                    if (results.rows.item(i).status != "Completed" && results.rows.item(i).abc == "6"){title += " - Pass" }
                    if (results.rows.item(i).status == "Completed" && results.rows.item(i).abc == "1"){title += " - A"}
                    if (results.rows.item(i).status == "Completed" && results.rows.item(i).abc == "2"){title += " - B+"}
                    if (results.rows.item(i).status == "Completed" && results.rows.item(i).abc == "3"){title += " - B"}
                    if (results.rows.item(i).status == "Completed" && results.rows.item(i).abc == "4"){title += " - B-"}
                    if (results.rows.item(i).status == "Completed" && results.rows.item(i).abc == "5"){title += " - C"}
                    if (results.rows.item(i).status == "Completed" && results.rows.item(i).abc == "6"){title += " - Pass"}
                    if (results.rows.item(i).status == "Completed" && results.rows.item(i).abc == "7"){title += " - Coverage Coming Soon"}
 
                    str += "<li data-role='list-divider' data-divider-theme='a' class='section'>" + title + "</li>";
                    status = results.rows.item(i).status;
                    abc = results.rows.item(i).abc;
                }
  
                str += "<li nid=" + results.rows.item(i).nid + " class='film'><a href='#' class='ui-link'>" + results.rows.item(i).title + 
                (results.rows.item(i).name === null?'':' | ' + results.rows.item(i).name) + "</a></li>";
        }
        str += "</ul>"

        $('#abc-list-contain').html(str);   
   
        if (abc_all_first_run == 1)
        {
            abc_all_first_run = 0
            //$('#abc-list-contain').trigger('create')
        }
        else
        {
            $('#abc-list-contain').listview("refresh");
        } 
        
    //$('#abc-list-contain').listview("refresh");

    $.mobile.changePage("#m_abc_list", { transition: "slide"} );
}

function renderProjectsABCList(tx, results){
    var title
        str = "<ul data-role='listview' data-theme='c' id='all-abc-list' data-filter='true' data-input='filterBasic-input' data-filter-placeholder='Search....'>";
        abc = '';
        for (var i = 0; i<results.rows.length; i++)
        {
                if (results.rows.item(i).abc != abc)
                {
                    if (results.rows.item(i).status != "Completed" && results.rows.item(i).abc == "1"){title = "Recommend" }
                    if (results.rows.item(i).status != "Completed" && results.rows.item(i).abc == "2"){title = "Strong Consider" }
                    if (results.rows.item(i).status != "Completed" && results.rows.item(i).abc == "3"){title = "Consider" }
                    if (results.rows.item(i).status != "Completed" && results.rows.item(i).abc == "4"){title = "Weak Consider" }
                    if (results.rows.item(i).status != "Completed" && results.rows.item(i).abc == "5"){title = "Wait See" }
                    if (results.rows.item(i).status != "Completed" && results.rows.item(i).abc == "6"){title = "Pass" } 
                    str += "<li data-role='list-divider' data-divider-theme='a' class='section'>" + title + "</li>";
                    abc = results.rows.item(i).abc;
                }
  
                str += "<li nid=" + results.rows.item(i).nid + " class='film'><a href='#' class='ui-link'>" + results.rows.item(i).title + 
                (results.rows.item(i).name === null?'':' | ' + results.rows.item(i).name) + "</a></li>";
        }
        str += "</ul>"

        $('#abc-list-contain').html(str);   
   
        if (abc_all_first_run == 1)
        {
            abc_all_first_run = 0
            //$('#abc-list-contain').trigger('create')
        }
        else
        {
            $('#abc-list-contain').listview("refresh");
        } 
        
    //$('#abc-list-contain').listview("refresh");

    $.mobile.changePage("#m_abc_list", { transition: "slide"} );
}

function renderList(tx, results){
    str = "<ul data-role='listview' data-theme='c' id='abc-list' data-filter='true' data-input='filterBasic-input' data-filter-placeholder='Search....'>";
    for (var i = 0; i<results.rows.length; i++){
        str += "<li nid=" + results.rows.item(i).nid + " class='film'><a href='#' class='ui-link'>" + results.rows.item(i).title + ' | ' + results.rows.item(i).name + "</a></li>";
    }
    str += "</ul>"
    $('#abc-list-contain').html(str);
    $.mobile.changePage("#m_abc_list", { transition: "slide"} ); 
     
    if (first_run_abc == 1){
        $('#abc-list-contain').trigger('create')
        first_run_abc = 0
    }
    else
    {   
        $('#abc-list-contain').trigger('create')
        $('#abc-list-contain').listview("refresh");
    }
        
}

function renderRecommendList(tx, results){
    $('#abc-list-title').text('Recommend')
    renderList(tx, results)
}

function renderStrongConsiderList(tx, results){
    $('#abc-list-title').text('Strong Consider')
    renderList(tx, results)    
}

function renderConsiderList(tx, results){
    $('#abc-list-title').text('Consider')
    renderList(tx, results)  
}

function renderWeakConsiderList(tx, results){
    $('#abc-list-title').text('Weak Consider')
    renderList(tx, results)   
}

function renderWaitSeeList(tx, results){
    $('#abc-list-title').text('Wait See')
    renderList(tx, results)     
}

function renderPassList(tx, results){
    $('#abc-list-title').text('Pass')
    renderList(tx, results)    
}

function renderFestivalList(tx, results){  
    $('#abc-list-title').text('Festival Screenings') 
    renderList(tx, results)
}

function renderMarketList(tx, results){
    $('#abc-list-title').text('Market Screenings')
    renderList(tx, results)   
}

function renderPromosList(tx, results){
    $('#abc-list-title').text('Promos')
    renderList(tx, results)
}

function renderFavesList(tx, results){
    str = "<ul data-role='listview' data-theme='c' id='faves-list' data-filter='true' data-input='filterBasic-input' data-filter-placeholder='Search....'>";
    rating = 0
    for (var i = 0; i<results.rows.length; i++)
    {
        if (results.rows.item(i).my_fave != rating){
            if (results.rows.item(i).my_fave == 0){star = "Not rated"}
            if (results.rows.item(i).my_fave == 1){star = "&#9733"}
            if (results.rows.item(i).my_fave == 2){star = "&#9733&#9733"}
            if (results.rows.item(i).my_fave == 3){star = "&#9733&#9733&#9733"}
            str += "<li data-role='list-divider' data-divider-theme='a' class='section'>" + star + "</li>";
            rating = results.rows.item(i).my_fave
        }
        str += "<li nid=" + results.rows.item(i).nid + " class='film favorite'><a href='#' class='ui-link'>" + results.rows.item(i).title + 
        (results.rows.item(i).name === null?'':' | ' + results.rows.item(i).name) + "</a></li>";
    }
    
    str +="</ul>"

    $('#m_my_faves_list').html(str); 
         
    if (faves_first_run == 1)
    {
        faves_first_run = 0
        $('#m_my_faves_list').trigger('create') 
    }
    else
    {
        $('#m_my_faves_list').trigger('create')
        $('#m_my_faves_list').listview("refresh");
    }


   $('#m_my_faves_list').listview("refresh");  

   $.mobile.changePage("#m_my_faves", { transition: "slide"} );
}

function renderScreenings(tx, results){
    var current_date = ''
	var current_time = ''
    str = "<ul data-role='listview' data-theme='c' id='screening-list' data-filter='true' data-input='filterBasic-input' data-filter-placeholder='Search....'>";
    for (var i = 0; i<results.rows.length; i++){
		/*
		Puts a date header if date changes
		if(results.rows.item(i).datetime.substring(0,10) != current_date)
		{
			str += "<li nid='" + results.rows.item(i).nid + "' data-role='list-divider' data-divider-theme='a' class='section'>" + getDateString(results.rows.item(i).datetime) + "</li>";
			current_date = results.rows.item(i).datetime.substring(0,10)
		}*/
		
        if (results.rows.item(i).datetime.substring(11,16) != current_time)  
            {
                d = getDateString(results.rows.item(i).datetime)     
                str += "<li nid='" + results.rows.item(i).nid + "' data-role='list-divider' data-divider-theme='a' class='section'>" + results.rows.item(i).datetime.substring(11,16) + "</li>";
				current_time = results.rows.item(i).datetime.substring(11,16)
            }
			 
        str += "<li nid=" + results.rows.item(i).nid + " class='film'><a href='#' class='ui-link'>" + results.rows.item(i).title + ' | ' + results.rows.item(i).room + "</a></li>";
    }
    str += "</ul>"
    $('#screening-list-contain').html(str);
    $.mobile.changePage("#m_screenings", { transition: "slide"} ); 
     
    if (first_run_screening == 1){
        $('#screening-list-contain').trigger('create')
        first_run_screening = 0
    }
    else
    {   
        $('#screening-list-contain').trigger('create')
        $('#screening-list-contain').listview("refresh");
    } 
}

function renderScreeningsVenue(tx, results){
    var venue = ''
    str = "<ul data-role='listview' data-theme='c' id='screening-list' data-filter='true' data-input='filterBasic-input' data-filter-placeholder='Search....'>";
    for (var i = 0; i<results.rows.length; i++){
        if (results.rows.item(i).venue+results.rows.item(i).room != venue)  
            {
                d = getDateString(results.rows.item(i).datetime)     
                console.log(d)
                str += "<li nid='" + results.rows.item(i).nid + "' data-role='list-divider' data-divider-theme='a' class='section'>" + 
                /*(results.rows.item(i).venue===null?"No Info":results.rows.item(i).venue) + */(results.rows.item(i).room===null?"":results.rows.item(i).room)+"</li>";
                venue = results.rows.item(i).venue+results.rows.item(i).room;
            } 
        str += "<li nid=" + results.rows.item(i).nid + " class='venue'><a href='#' class='ui-link'>" + results.rows.item(i).title + '</br>' + d +" - " + results.rows.item(i).datetime.substring(11,16) + "</a></li>";
    }
    str += "</ul>"
    $('#screening-list-contain').html(str);
    $.mobile.changePage("#m_screenings", { transition: "slide"} ); 
     
    if (first_run_screening_venue == 1){
        $('#screening-list-contain').trigger('create')
        first_run_screening_venue = 0
    }
    else
    {   
        $('#screening-list-contain').trigger('create')
        $('#screening-list-contain').listview("refresh");
    } 
}

function renderScreenings_x_Date(tx, results){
	//alert('renderScreening_x_DateList | '+results.rows.length)
    str = "<ul data-role='listview' data-theme='c' id='screening-date-list' data-filter='true' data-input='filterBasic-input' data-filter-placeholder='Search....'>";
    for (var i = 0; i<results.rows.length; i++){
        str += "<li class='screening-date' dte='"+ results.rows.item(i).dateonly +"'><a class='ui-link'>" + getDateString(results.rows.item(i).dateonly) + "</a></li>";
    }
    str += "</ul>"
    $('#screening-list-contain').html(str);
    //$.mobile.changePage("#m_fest", { transition: "slide"} ); 
     
    if (first_run_section == 1){
        $('#screening-list-contain').trigger('create')
        first_run_datelist = 0
    }
    else
    {   
        $('#screening-list-contain').trigger('create')
        $('#screening-list-contain').listview("refresh");
    }
}

function renderSectionsList(tx, results){
	//alert('renderSectionsList | '+results.rows.length)
    str = "<ul data-role='listview' data-theme='c' id='section-list'>";
    for (var i = 0; i<results.rows.length; i++){
        str += "<li class='sections'><a class='ui-link'>" + results.rows.item(i).section + "</a></li>";
    }
    str += "</ul>"
    $('#section-wrapper').html(str);
    $.mobile.changePage("#m_fest", { transition: "slide"} ); 
     
    if (first_run_section == 1){
        $('#section-wrapper').trigger('create')
        first_run_section = 0
    }
    else
    {   
        $('#section-wrapper').trigger('create')
        $('#section-wrapper').listview("refresh");
    }
}

function renderABCList(tx, results){
	$('.a-btn').attr('list',which_list)
	$('.b-btn').attr('list',which_list)
	$('.c-btn').attr('list',which_list)
	abc = '';
    str = "<ul data-role='listview' data-theme='c' id='abc-list-2' data-filter='true' data-input='filterBasic-input' data-filter-placeholder='Search....'>";
    for (var i = 0; i<results.rows.length; i++){
        {
			var a = 'No Info'
			switch (results.rows.item(i).abc){
				case '1':
					a="A";
					break;
				case '2':
					a="B";
					break;
				case '3':
					a="C";
					break;
				case '4':
					a="Pass";
					break;
			}
        if (a != abc)  
                str += "<li nid='" + results.rows.item(i).nid +"' list='"+ which_list +"' data-role='list-divider' data-divider-theme='a' class='section'>" + 
                a + "</li>";
                abc = a;
            }
			
        str += "<li nid=" + results.rows.item(i).nid + " class='film'><a href='#' class='ui-link'>" + results.rows.item(i).title + ' | ' + results.rows.item(i).name + "</a></li>";
    }
    str += "</ul>"
    $('#abc-list-2-wrapper').html(str);
    $.mobile.changePage("#m-abc-list-2", { transition: "slide"} ); 
     
    if (first_run_abc_2 == 1){
        $('#abc-list-2-wrapper').trigger('create')
        first_run_abc_2 = 0
    }
    else
    {   
        $('#abc-list-2-contain').trigger('create')
        $('#abc-list-2-contain').listview("refresh");
    }
}

function getDateString(dte){
	var d = new Date(dte.substring(0,10))
	var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
	var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
	var year = dte.substring(0,4)
	var month = months[dte.substring(6,7)-1]
	var day = days[d.getDay()]
	return day +", " + month + " " + dte.substring(8,10)+", " + year
}

function getDateStringNoDOW(dte){
	var d = new Date(dte.substring(0,10))
	var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
	var year = dte.substring(0,4)
	var month = months[dte.substring(6,7)-1]
	return month + " " + dte.substring(8,10)+" " + dte.substring(11,16)
}

function getTimeString(dte){
	return dte.substring(11,16)

}

// Button launch pad

$(document).on("click","#login_button", function(event){   
    console.log('Login button clicked')
    db.transaction(startInit);   
})

$(document).on("click","#goto_film_list", function(event){
    str =  db.transaction(function getAllFilms(tx){tx.executeSql('SELECT a.nid as nid, a.title, b.name, a.salesco_nid FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid ORDER BY a.title',[ ], renderFilmList, errorCB);});
})

$(document).on("click","#goto_comp_list", function(event){
    str =  db.transaction(function getAllFilms(tx){tx.executeSql('SELECT * FROM COMPS ORDER BY name',[ ], renderCompList, errorCB);});
})
    
$(document).on("click","#goto_abc_list", function(event){  
    $.mobile.changePage("#m_abc_menu", {transition: "slide"} ); 
})
    
$(document).on("click","#goto_screenings", function(event){
    str = db.transaction(function getScreenings(tx){tx.executeSql('SELECT DISTINCT dateonly FROM SCREENINGS ORDER BY dateonly',[],renderScreenings_x_Date, errorCB)})
    $.mobile.changePage("#m_screenings", {transition: "slide"} ); 
})
    
$(document).on("click","#goto_my_faves", function(event){
    str =  db.transaction(function getAllFilms(tx){tx.executeSql('SELECT a.nid as nid, a.title, b.name, a.salesco_nid, a.my_fave FROM FILMS as a \
    LEFT JOIN COMPS as b ON a.salesco_nid = b.nid WHERE a.my_fave != "0" AND a.my_fave is not null and a.my_fave !="" ORDER BY my_fave DESC, a.title',[ ], renderFavesList, errorCB);});
    $.mobile.changePage("#m_my_faves", {transition: "slide"} ); 
})
    
$(document).on("click","#goto_search", function(event){
    $.mobile.changePage("#m_search", {transition: "slide"} ); 
})
  
$(document).on("click","#update", function(event){  
  db.transaction(getTableLengths);
  // App has data - check for connection to check for updates - not critical to app running  

  $.ajax({
    type: 'GET',
    dataType : 'json',
    cache: false,
    crossDomain: true,
    url: 'http://www.orange-ent.net/m_check_connection',
    error: function(jqXHR, txtStatus, errorThrown){ 
        $('#question').text('Unable to update data.  You may use app but the data may not be up to date.')
        $( "#confirm" ).popup( "open" );
    },
    success: function(obj){   
        fest = JSON.stringify(obj) 
        console.log('connection made - current fest: ' + fest)
        db.transaction(function dumdum(tx){tx.executeSql("SELECT * FROM ACCESS_LOG", [], function (tx, results) {  
             console.log('App currently has fest ' + results.rows.item(0).fest)
             if(results.rows.item(0).fest == fest)
             {
                 db.transaction(getUpdatedFilmData);
             }           
             else
             {   
                 console.log('New festival data available from server')  
                 $('#confirm-new-fest-spring').popup("open")                   
             }
          })
        })
    }})
})   

$(document).on("click","#goto_fest", function(event){
    str =  db.transaction(function getAllFilms(tx){tx.executeSql('SELECT DISTINCT section FROM FILMS WHERE section is not null ORDER BY section',[ ], renderSectionsList, errorCB);});
    $.mobile.changePage("#m_fest", {transition: "slide"} ); 
})
    
$(document).on("click","#projects-btn", function(event){
    $('#projects-btn').removeClass('ui-control-inactive').addClass('ui-control-active')
    $('#contacts-btn').removeClass('ui-control-active').addClass('ui-control-inactive')
    contacts = 0;
    db.transaction(function getAllProjects(tx){tx.executeSql('SELECT a.nid as nid, title FROM COMPS as a \
    LEFT JOIN FILMS as b ON a.nid = b.salesco_nid WHERE a.nid = "'+nid+'" ORDER BY title',[], renderCompFilmList, errorCB)})
})
  
$(document).on("click","#contacts-btn", function(event){
    //alert('contacts nid=' + nid)
    $('#contacts-btn').removeClass('ui-control-inactive').addClass('ui-control-active')
    $('#projects-btn').removeClass('ui-control-active').addClass('ui-control-inactive')
    contacts = 1;
    db.transaction(function getAllContacts(tx){tx.executeSql('SELECT DISTINCT phone,label, a.nid as nid FROM COMPS as a \
        INNER JOIN COMP_PHONES as c ON a.nid = c.nid AND c.delta = d.delta \
        INNER JOIN COMP_PH_LABELS as d ON a.nid = d.nid  \
        WHERE a.nid = "' + nid + '" ORDER BY label',
    [ ], renderCompContactList, errorCB)})
})

$(document).on("click","#lineup-btn", function(event){
   var ref = window.open("http://www.orange-ent.net/" + $(this).attr('url'), '_blank', 'location=yes');
})
  
$(document).on("click","#film-title-btn", function(event){
    if ($('#film-title-btn').hasClass('ui-control-inactive')){
        $('#film-title-btn').removeClass('ui-control-inactive').addClass('ui-control-active')
        $('#film-salesco-btn').removeClass('ui-control-active').addClass('ui-control-inactive')
        $('#film-section-btn').removeClass('ui-control-active').addClass('ui-control-inactive')
        $('#the-list').html('');  // clear old list to re-render
        order_by_salesco = 0;
        order_by_section = 0;
        db.transaction(function getAllFilms(tx){tx.executeSql('SELECT a.nid as nid, a.title, b.name, b.nid as comp_nid FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid ORDER BY b.name',[ ], renderFilmList, errorCB);});   
    }
})
    
$(document).on("click","#film-section-btn", function(event){
    //alert('section')
    if ($('#film-section-btn').hasClass('ui-control-inactive')){
        $('#film-title-btn').removeClass('ui-control-active').addClass('ui-control-inactive')
        $('#film-salesco-btn').removeClass('ui-control-active').addClass('ui-control-inactive')
        $('#film-section-btn').removeClass('ui-control-inactive').addClass('ui-control-active')
        $('#the-list').html('');  // clear old list to re-render
        order_by_salesco = 0;
        order_by_section = 1;
        db.transaction(function getAllFilms(tx){tx.executeSql('SELECT a.nid as nid, a.title, b.name, section FROM FILMS as a \
        LEFT JOIN COMPS as b ON a.salesco_nid = b.nid \
        ORDER BY CASE section WHEN "Festival Screening" THEN 0\
        WHEN "Market Screening" THEN 1\
        WHEN "Projects" THEN 2\
        ELSE 4 END',[ ], renderFilmList, errorCB);});
    }
})

$(document).on("click","#film-salesco-btn", function(event){
    if ($('#film-salesco-btn').hasClass('ui-control-inactive')){
        $('#film-title-btn').removeClass('ui-control-active').addClass('ui-control-inactive')
        $('#film-salesco-btn').removeClass('ui-control-inactive').addClass('ui-control-active')
        $('#film-section-btn').removeClass('ui-control-active').addClass('ui-control-inactive')
        $('#the-list').html('');  // clear old list to re-render
        order_by_salesco = 1;
        order_by_section = 0;
        db.transaction(function getAllFilms(tx){tx.executeSql('SELECT a.nid as nid, a.title, b.name, b.nid as comp_nid FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid ORDER BY b.name',[ ], renderFilmList, errorCB);});   
    }
})

$(document).on("click",".screenings-venue", function(event){
	$('.screenings-date').removeClass('ui-control-inactive').addClass('ui-control-active')
	$('.screenings-venue').removeClass('ui-control-active').addClass('ui-control-inactive')
    str = db.transaction(function getScreenings(tx){tx.executeSql('SELECT * FROM SCREENINGS as a INNER JOIN FILMS as b ON a.nid = b.nid ORDER BY a.venue,a.room,a.datetime, b.title',[],renderScreeningsVenue, errorCB);});
})

$(document).on("click",".screenings-date", function(event){
	$('.screenings-venue').removeClass('ui-control-inactive').addClass('ui-control-active')
	$('.screenings-date').removeClass('ui-control-active').addClass('ui-control-inactive')
    str = db.transaction(function getScreenings(tx){tx.executeSql('SELECT DISTINCT dateonly FROM SCREENINGS ORDER BY dateonly',[],renderScreenings_x_Date, errorCB)})
})

$(document).on("click",".a-btn", function(event){
		    $('.a-btn').removeClass('ui-control-inactive').addClass('ui-control-active')
		    $('.b-btn').removeClass('ui-control-active').addClass('ui-control-inactive')
			$('.c-btn').removeClass('ui-control-active').addClass('ui-control-inactive')
			first_run_abc_2 = 1
		    db.transaction(function getFilmDetail(tx){tx.executeSql('SELECT a.nid as nid, a.title, b.name, a.abc \
		    FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid WHERE a.status= "Completed" AND a.type = "' + which_list +'" \
		    AND a.abc == "1" ORDER BY a.title',[], renderABCList, errorCB);});
})

$(document).on("click",".b-btn", function(event){
		    $('.b-btn').removeClass('ui-control-inactive').addClass('ui-control-active')
		    $('.a-btn').removeClass('ui-control-active').addClass('ui-control-inactive')
			$('.c-btn').removeClass('ui-control-active').addClass('ui-control-inactive')
			first_run_abc_2 = 1
		    db.transaction(function getFilmDetail(tx){tx.executeSql('SELECT a.nid as nid, a.title, b.name, a.abc \
		    FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid WHERE a.status= "Completed" AND a.type = "' + which_list +'" \
		    AND a.abc == "2" ORDER BY a.title',[], renderABCList, errorCB);});		
})

$(document).on("click",".c-btn", function(event){
		    $('.c-btn').removeClass('ui-control-inactive').addClass('ui-control-active')
		    $('.b-btn').removeClass('ui-control-active').addClass('ui-control-inactive')
			$('.a-btn').removeClass('ui-control-active').addClass('ui-control-inactive')
			first_run_abc_2 = 1
		    db.transaction(function getFilmDetail(tx){tx.executeSql('SELECT a.nid as nid, a.title, b.name, a.abc \
		    FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid WHERE a.status= "Completed" AND a.type = "' + which_list +'" \
		    AND a.abc == "3" ORDER BY a.title',[], renderABCList, errorCB);});
})

$(document).on("click","#univ-search-button", function(event){  
    term = $('#search-basic').val()
    sql = 'SELECT a.nid as anid, * FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid WHERE title LIKE "%'+term+'%" OR director LIKE "%'+term+
    '%" OR producers LIKE "%'+term+'%" OR casting LIKE "%'+term+'%" OR writers LIKE "%'+term+'%" ORDER BY title'       
    db.transaction(function x(tx){tx.executeSql(sql, [], function(tx,results){ 
        //alert('Found ' + results.rows.length + ' rows.')     
        $('.u-search').remove()
        for (var i = 0; i<results.rows.length; i++){
            var str = "<li nid=" + results.rows.item(i).anid + " class='film u-search' s-string='"+term+"'><a href='#' class='ui-link'>" + results.rows.item(i).title + ' | ' + results.rows.item(i).name + "</a></li>";
            $('#search-results').append(str);
        }
        
        $('#search-results').listview("refresh");  
        })}, errorCB) 
     
        //if (first_run_search == 1){
            //$('#search-results-wrapper').trigger('create')   
            //
           /* first_run_abc = 0
        }
        else
        {   
            $('#abc-list-contain').trigger('create')
            $('#abc-list-contain').listview("refresh");
        } */       
})

$(document).on("click",".star", function(event){
    rating = 0
    var r = 0
    var id = $(this).attr('id')
    var nid = $(this).parent().attr('nid')
    sql = 'SELECT my_fave FROM FILMS WHERE nid = "'+$(this).parent().attr('nid')+'"'
    db.transaction(function enterFave(tx){tx.executeSql(sql, [], function (tx,results) {
       r = (results.rows.length == 0?0:results.rows.item(0).my_fave)
       //alert(r+" | "+id)
       if ((r == 1 && id == 'star-1') ||
           (r == 2 && id == 'star-2') ||
           (r == 3 && id == 'star-3'))
           {
               $('#star-1').html('&#9734')
               $('#star-2').html('&#9734')
               $('#star-3').html('&#9734')
               rating = 0
           }
           else
           {
               if (id == 'star-1')
               {
                   $('#star-1').html('&#9733')
                   $('#star-2').html('&#9734')
                   $('#star-3').html('&#9734')
                   rating = 1
               }
               else
               {
                   if (id == 'star-2')
                   {
                       $('#star-1').html('&#9733')
                       $('#star-2').html('&#9733')
                       $('#star-3').html('&#9734')
                       rating = 2
                   }
                   else
                   {
                       $('#star-1').html('&#9733')
                       $('#star-2').html('&#9733')
                       $('#star-3').html('&#9733')
                       rating = 3
                   }
               }
           }   
           sql = 'UPDATE FILMS SET my_fave = "'+rating+'" WHERE nid = "'+nid+'"'
           db.transaction(function enterFave(tx){tx.executeSql(sql)}) 
        }, errorCB)});
})

$(document).on("click","#script_link", function(event){
    var ref = window.open($('#script_link').attr('url'), '_blank', 'location=yes'); 
})

function faveEntered(){
    // dummy function - do not delete
}

function saveCompInfo(tx, results){
    comp_name = results.rows.item(0).name
    comp_addr = results.rows.item(0).addr
}

$( document ).on( "swipeleft swiperight", "li.ui-li.favorite", function( event ) {
    //$( document ).on( "click", "li.ui-li", function( event ){
    
    var listitem = $( this ),
    // These are the classnames used for the CSS transition
    dir = event.type === "swipeleft" ? "left" : "right",
    // Check if the browser supports the transform (3D) CSS transition
    transition = $.support.cssTransform3d ? dir : false;
    //alert('Delete swipe detected - Transition: ' + transition)
    removeDeleteFlag==0
    $(this).prepend('<a class="aDeleteBtn ui-btn-up-r" nid = "'+$(this).attr('nid')+'" onClick="$(\'.aDeleteBtn\').remove()">Delete</a>')
});
    
$( document ).on( "mobileinit", function() {
  $.mobile.loader.prototype.options.text = "loading";
  $.mobile.loader.prototype.options.textVisible = false;
  $.mobile.loader.prototype.options.theme = "a";
  $.mobile.loader.prototype.options.html = "";
});

$(document).on("click",'li', function (event) {
    nid = $(this).attr("nid");
    search_string = $(this).attr('s-string')
    
    if($(this).hasClass('comp')){
        
         db.transaction(function getCompDetail(tx){tx.executeSql("SELECT * FROM COMPS WHERE nid = '" + nid +"'",[], saveCompInfo, errorCB);});
         
         // We have nid, so hit callback to get detail info
         if (contacts == 1){
            var sql = 'SELECT DISTINCT phone,label, a.nid as nid FROM COMPS as a \
                INNER JOIN COMP_PHONES as c ON a.nid = c.nid AND c.delta = d.delta \
                INNER JOIN COMP_PH_LABELS as d ON a.nid = d.nid  \
                WHERE a.nid = "' + nid + '" ORDER BY label';
         }
         else
         {
             var sql = "SELECT *,a.nid as nid, b.nid as bnid FROM COMPS as a\
             LEFT JOIN films as b ON a.nid = b.salesco_nid \
             WHERE a.nid = '" + nid+"' ORDER BY b.title";
         }
         db.transaction(function getCompDetail(tx){tx.executeSql(sql,[], renderCompDetail, errorCB);});
         $.mobile.changePage("#m_comp_detail", { transition: "slide"} );
    }
    
    if($(this).hasClass('film')){
        //alert('film')
        // We have nid, so hit callback to get detail info  
        
        var sql = "SELECT *, b.nid as bnid, a.nid as nid FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid WHERE a.nid = '" + nid +"'";
        db.transaction(function getFilmDetail(tx){tx.executeSql(sql,[], renderFilmDetail, errorCB);});
        $.mobile.changePage("#m_film_detail", { transition: "slide"} );
        //$("#m_film_detail").trigger('create');
    }
	
	if($(this).hasClass('sections')){
		var section = $(this).text().trim()
		var sql = "SELECT *, b.nid as bnid, a.nid as nid FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid WHERE a.section like '%" + section +"%' ORDER BY a.title";
        $('#abc-list-title').html(section)
		db.transaction(function dummmmy(tx){tx.executeSql(sql,[], renderList, errorCB);});
	}
	
	if($(this).hasClass('screenings_list')){
		$('#abc-list-title').html('Screenings')
	    str =  db.transaction(function getAllFilms(tx){tx.executeSql('SELECT a.nid as nid, a.title, b.name, a.salesco_nid FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid ORDER BY a.title',[ ], renderFilmList, errorCB);});
	}
	
	if ($(this).hasClass('screening-date')){
		console.log('li screening-date')
		var date_only = $(this).attr('dte').trim()
		console.log(date_only)
		var sql = db.transaction(function getScreenings(tx){tx.executeSql('SELECT * FROM SCREENINGS as a INNER JOIN FILMS as b ON a.nid = b.nid WHERE a.dateonly like "%'+date_only +'%" ORDER BY a.datetime, b.title',[],renderScreenings, errorCB);});

	}
    
	if($(this).hasClass('promos_list')){
		alert('yo')
		var sql = "SELECT *, b.nid as bnid, a.nid as nid FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid WHERE a.type = 'Promos' ORDER BY a.title";
        $('#abc-list-title').html('Promos')
		db.transaction(function dummmmy(tx){tx.executeSql(sql,[], renderList, errorCB);});
	}
    
	if($(this).hasClass('projects_list')){
		var sql = "SELECT *, b.nid as bnid, a.nid as nid FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid WHERE a.type = 'Projects' ORDER BY a.title";
        $('#abc-list-title').html('Projects')
		db.transaction(function dummmmy(tx){tx.executeSql(sql,[], renderList, errorCB);});
	}
    
    /*if($(this).hasClass('favorite')){
        //if(removeDeleteFlag==0){
            $('.aDeleteBtn').remove()
        //}
        removeDeleteFlag==0
        $(this).prepend('<a class="aDeleteBtn ui-btn-up-r" nid = "'+$(this).attr('nid')+'" onClick="$(\'.aDeleteBtn\').remove()">Delete</a>')
        
    }*/

    $(document).on("click",'.aDeleteBtn', function(event){
        event.stopPropagation
        sql = 'UPDATE FILMS SET my_fave = "0" WHERE nid = "'+$(this).attr('nid') + '"'
        //alert('clicked delete')
        db.transaction(function removeStar(tx){tx.executeSql(sql);}); 
        $('li[nid="'+$(this).attr('nid')+'"]').remove() 
        removeDeleteFlag = 1
    })

    if($(this).hasClass('contact')){
        alert('contact detail')
        // We have nid, so hit callback to get detail info
        //var sql = "SELECT * FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid WHERE a.nid = '" + nid +"'";
        //db.transaction(function getFilmDetail(tx){tx.executeSql(sql,[], renderFilmDetail, errorCB);});
        //$.mobile.changePage("#m_film_detail", { transition: "slide"} );
        //$("#m_film_detail").trigger('create');
    }
    
    if($(this).hasClass('projects')){
        $.mobile.changePage("#m_project_cat_menu", { transition: "slide"} );
    }
    
    if($(this).hasClass('abc')){
		if ($(this).attr('id')=='festival'){which_list = 'Festival Screening'}
		if ($(this).attr('id')=='market'){which_list = 'Market Screening'}
		if ($(this).attr('id')=='promos'){which_list = 'Promos'}
        switch ($(this).attr('id')){
            case 'festival':
				first_run_abc_2 = 1
				$('#m-abc-list-2 > div > h1').text('Festival ABC List')
                db.transaction(function getFilmDetail(tx){tx.executeSql('SELECT a.nid as nid, a.title, b.name, a.abc \
                FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid WHERE a.status= "Completed" AND a.type = "Festival Screening" \
                AND a.abc IS NOT NULL AND a.abc != "0" ORDER BY abc,a.title',[], renderABCList, errorCB);});
                break;
            case 'market':	
				$('#m-abc-list-2 > div > h1').text('Market ABC List')
				first_run_abc_2 = 1		    
                db.transaction(function getFilmDetail(tx){tx.executeSql('SELECT a.nid as nid, a.title, b.name, a.abc \
                FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid WHERE a.status ="Completed" AND (a.type ="Market Screening")\
                AND a.abc IS NOT NULL and a.abc !="0" ORDER BY abc,a.title',[], renderABCList, errorCB);});
                break;
            case 'promos':
				first_run_abc_2 = 1
				$('#abc-list-title').text("Promos")
                db.transaction(function getFilmDetail(tx){tx.executeSql("SELECT *, b.nid as bnid, a.nid as nid FROM FILMS as a LEFT JOIN COMPS as b \
				ON a.salesco_nid = b.nid WHERE a.type = 'Promos' ORDER BY a.title",[], renderList, errorCB);});
                break;
			case 'projects':
				first_run_abc_2 = 1
				$('#abc-list-title').text("Projects")
                db.transaction(function getFilmDetail(tx){tx.executeSql("SELECT *, b.nid as bnid, a.nid as nid FROM FILMS as a LEFT JOIN COMPS as b \
				ON a.salesco_nid = b.nid WHERE a.type = 'Projects' AND abc is not null and abc!= '0' \
				ORDER BY a.abc, a.title",[], renderProjectsABCList, errorCB);});
				break;
            default:
                break;
        }       
    }
    
    if($(this).hasClass('all-abc')){
        db.transaction(function getFilmDetail(tx){tx.executeSql('SELECT a.nid as nid, a.title, b.name, status, abc \
        FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid \
        ORDER BY status, CASE abc WHEN 1 THEN 0 WHEN 2 THEN 1 WHEN 3 THEN 2 WHEN 4 THEN 3 WHEN 5 THEN 4 WHEN 6 THEN 5 WHEN 7 THEN 6 WHEN 8 THEN 7 ELSE 8 END, title',[], renderAllABCList, errorCB);});
    }
    
    //CASE abc WHEN 1 THEN 0 WHEN 2 THEN 1 WHEN 3 THEN 2 WHEN 4 THEN 3 WHEN 5 THEN 4 WHEN 6 THEN 5 WHEN 7 THEN 6 WHEN 8 THEN 7 ELSE 8 END
    
    if($(this).hasClass('project')){
        switch ($(this).attr('id')){
            case 'recommend':
                db.transaction(function getFilmDetail(tx){tx.executeSql('SELECT a.nid as nid, a.title, b.name \
                FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid WHERE a.status !="Completed" AND a.type="Projects" AND abc="1"\
                ORDER BY a.title',[], renderRecommendList, errorCB);});
                break;
            case 'strong-consider':
                db.transaction(function getFilmDetail(tx){tx.executeSql('SELECT a.nid as nid, a.title, b.name \
                FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid WHERE a.status !="Completed" AND a.type="Projects" AND abc="2"\
                ORDER BY a.title',[], renderStrongConsiderList, errorCB);});
                break;
            case 'consider':
                db.transaction(function getFilmDetail(tx){tx.executeSql('SELECT a.nid as nid, a.title, b.name \
                FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid WHERE a.status !="Completed" AND a.type="Projects" AND abc="3"\
                ORDER BY a.title',[], renderConsiderList, errorCB);});
                break;
            case 'weak-consider':
                db.transaction(function getFilmDetail(tx){tx.executeSql('SELECT a.nid as nid, a.title, b.name \
                FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid WHERE a.status !="Completed" AND a.type="Projects" AND abc="4"\
                ORDER BY a.title',[], renderWeakConsiderList, errorCB);});
                break;
            case 'wait-see':
                db.transaction(function getFilmDetail(tx){tx.executeSql('SELECT a.nid as nid, a.title, b.name \
                FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid WHERE a.status !="Completed" AND a.type="Projects" AND abc="5"\
                ORDER BY a.title',[], renderWaitSeeList, errorCB);});
                break;
            case 'pass':
                db.transaction(function getFilmDetail(tx){tx.executeSql('SELECT a.nid as nid, a.title, b.name \
                FROM FILMS as a LEFT JOIN COMPS as b ON a.salesco_nid = b.nid WHERE a.status !="Completed" AND a.type="Projects" AND abc="6"\
                ORDER BY a.title',[], renderPassList, errorCB);});
                break;
            default:
                break;
        }       
        
    }
    
});
