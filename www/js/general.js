

var General = {

    _getToken: function (){
        var token = "token ";
        var infoUser = localStorage.getItem("infoUser");
        if (infoUser) {
            var infoUser = JSON.parse(infoUser);
            token += infoUser.token;
        }
        return token;
    },

    post: function (url, params) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                headers: { Authorization: General._getToken() },
                type: "post",
                url: url,
                data: params,
                dataType: "json",
                success: function (result) { resolve(result); },
                error: function (err) { reject(err); }
            });
       });
   },

   put: function (url, params) {
       return new Promise(function (resolve, reject) {
           $.ajax({
               headers: { Authorization: General._getToken() },
               type: "put",
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
               headers: { Authorization: General._getToken() },
               type: "get",
               url: url,
               dataType: "json",
               success: function (result) { resolve(result); },
               error: function (err) { reject(err); }
           });
      });
  },

  delete: function (url) {
      return new Promise(function (resolve, reject) {
          $.ajax({
              headers: { Authorization: General._getToken() },
              type: "delete",
              url: url,
              dataType: "json",
              success: function (result) { resolve(result); },
              error: function (err) { reject(err); }
          });
     });
 },

}
