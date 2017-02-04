

var General = {

    post: function (url, params) {
        return new Promise(function (resolve, reject) {
            $.ajax({
               type: "post",
               url: url,
               data: params,
               dataType: "json",
               success: function (result) { resolve(result); },
               error: function (err) { reject(err); }
           });
       });
   },

   get: function (url) {
       return new Promise(function (resolve, reject) {
           $.ajax({
              type: "get",
              url: url,
              dataType: "json",
              success: function (result) { resolve(result); },
              error: function (err) { reject(err); }
          });
      });
  },


}
