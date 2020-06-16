function initialiseState() {
    if (!("showNotification" in ServiceWorkerRegistration.prototype)) {
        console.warn("プッシュ通知が対応されておりません");
        return;
    }

    if (Notification.permission === "denied") {
        console.warn("通知をブロックしております");
        return;
    }

    if (!("PushManager" in window)) {
        console.warn("プッシュ通知が対応されておりません");
        return;
    }

    //既に過去に登録されている場合は登録するボタンではなく、削除ボタンを表示します
    navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
        serviceWorkerRegistration.pushManager.getSubscription().then(
                function (subscription) {
                    console.log(subscription);
                    $("#push_regist").hide();
                    $("#push_delete").hide();

                    if (!subscription) {
                        $("#push_regist").show();
                        return;
                    }
                    $("#push_delete").show();
                }).catch(function(err){
                    console.warn("Error during getSubscription()", err);
                });
    });
}

$(document).ready(function(){
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js").then(
            function (registration) {
                if (typeof registration.update == "function") {
                    registration.update();
                }

                initialiseState();
            }).catch(function (error) {
                console.error("Service Worker registration failed: ", error);
            });
    }

    //サブスクリプションを発行します
    $("#push_regist").on("click", function(){
        Notification.requestPermission(function(permission) {
            if(permission !== "denied") {
                subscribe();
            } else {
                alert ("プッシュ通知を有効にできません。ブラウザの設定を確認して下さい。");
            }
        });
    });

    //サブスクリプションをサーバ、ブラウザ共に削除します
    $("#push_delete").on("click", function(){
        unsubscribled();
    });

    function subscribe() {
        navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
            serviceWorkerRegistration.pushManager.subscribe({ userVisibleOnly: true }).then(
                function(subscription) {
                    $("#push_regist").hide();
                    $("#push_delete").show();

                    return sendSubscriptionToServer(subscription);
                }
            ).catch(function (e) {
                if (Notification.permission == "denied") {
                    console.warn("Permission for Notifications was denied");
                } else {
                    console.error("Unable to subscribe to push.", e);
                    window.alert(e);
                }
            })
        });
    }

    function unsubscribled() {
        navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
            serviceWorkerRegistration.pushManager.getSubscription().then(
                function(subscription) {
                    if (!subscription ) {
                        $("#push_regist").show();
                        $("#push_delete").hide();
                        return;
                    }

                    sendSubscriptionToServerForDelete(subscription);

                    subscription.unsubscribe().then(function(successful) {
                        $("#push_regist").show();
                        $("#push_delete").hide();
                    }).catch(function(e) {
                        console.error("Unsubscription error: ", e);
                        $("#push_regist").show();
                        $("#push_delete").hide();
                    });
                }
            ).catch(
                function(e) {
                    console.error("Error thrown while unsubscribing from push messaging.", e);
                }
            )
        });
    }

    function sendSubscriptionToServer(subscription) {
        //発行したサブスクリプションをサーバー側に送信します。
        //ここではサブスクリプションを/recieve.phpに送信しています。
        console.log('sending to server for regist:',subscription.endpoint);
        var data = {"subscription" : subscription.endpoint};
        $.ajax({
            type: "POST",
            url: "/recieve.php",
            dataType: "json",
            cache: false,
            data: data
        });
    }

    function sendSubscriptionToServerForDelete(subscrption) {
        //TODO サブスクリプションをサーバーから削除する処理。テストなので実装していません。
        console.log('sending to server for delete:', subscrption);
    }
});