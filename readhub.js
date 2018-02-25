/***
Github: https://github.com/gadzan/readhub
Author: Gadzan
Usage: ReadHub
***/

var
  newsRawData = [],
  newsType = "news"

const
  version = 1.0,
  menuIndex = ["news", "technews", "blockchain"],
  listTemplate = [{
      type: "label",
      props: {
        id: "newsTitle",
        font: $font("bold", 18),
        lines: 2,
        align: $align.left
      },
      layout: function(make, view) {
        make.top.inset(15)
        make.left.right.inset(15)
        make.height.equalTo(50)
      }
    },
    {
      type: "label",
      props: {
        id: "newsSummary",
        textColor: $color("#8A8A8A"),
        font: $font(15),
        lines: 4
        //autoFontSize: true
      },
      layout: function(make, view) {
        make.top.equalTo(view.prev.bottom).offset(0)
        make.left.right.inset(15)
      }
    },
    {
      type: "label",
      props: {
        id: "newsSite",
        textColor: $color("#AAA"),
        font: $font(12),
        lines: 1
      },
      layout: function(make, view) {
        make.bottom.inset(15)
        make.left.inset(15)
      }
    },
    {
      type: "label",
      props: {
        id: "newsTime",
        textColor: $color("#AAA"),
        font: $font(12),
        lines: 1
      },
      layout: function(make, view) {
        make.left.equalTo(view.prev.right).offset(15)
        make.top.equalTo(view.prev.top)
      }
    }
  ],
  nav = {
    type: "view",
    props: {
      id: "nav"
    },
    views: [{
      type: "menu",
      props: {
        id: "menu",
        index: 0,
        items: ["科技动态", "开发者资讯", "区块链快讯"]
      },
      layout: function(make, view) {
        make.top.left.right.equalTo(0)
        make.height.equalTo(50)
      },
      events: {
        changed: function(sender) {
          menuChanged(sender.index)
        }
      }
    }],
    layout: function(make, view) {
      make.top.left.right.inset(0)
      make.height.equalTo(50)
    }
  },
  newsList = {
    type: "list",
    props: {
      id: "newsList",
      template: listTemplate,
      actions: [{
        title: "分享",
        handler: function(sender, indexPath) {
          $ui.toast("分享");
          var shareObj = [newsRawData[indexPath.row].mobileUrl, newsRawData[indexPath.row].title]
          $share.sheet(shareObj)
        }
      }]
    },
    layout: function(make, view) {
      make.top.inset(50)
      make.left.right.bottom.inset(0)
    },
    events: {
      rowHeight: function(sender, indexPath) {
        if (newsRawData[indexPath.row].summaryAuto == "") {
          return 100
        } else {
          return 180
        }
      },
      didSelect: function(sender, indexPath, data) {
        //console.log(data)
        $ui.push({
          views: [{
            type: "web",
            props: {
              url: data.newsLink.toString()
            },
            layout: $layout.fill
          }]
        })
      },
      didReachBottom: function(sender) {
        sender.endFetchingMore()
        var cursor = new Date(newsRawData[newsRawData.length - 1].publishDate)
        getData(newsType, cursor.getTime(), function(rawdata) {
          newsRawData = newsRawData.concat(rawdata)
          $("newsList").data = formateData(newsRawData)
        })
      },
      pulled: function(sender) {
        $("newsList").beginRefreshing()
        getData(newsType, null, function(rawdata) {
          newsRawData.splice(0, 20)
          newsRawData = rawdata.concat(newsRawData)
          $("newsList").data = formateData(newsRawData)
        })
      }
    }
  }

function timeAgo(time) {
  var currentTime = Date.parse(new Date())
  var dateTime = time
  var d_day = Date.parse(new Date(dateTime));
  var day = Math.abs(parseInt((d_day - currentTime) / 1000 / 3600 / 24))
  var hour = Math.abs(parseInt((d_day - currentTime) / 1000 / 3600))
  var minutes = Math.abs(parseInt((d_day - currentTime) / 1000 / 60))
  var seconds = Math.abs(parseInt((d_day - currentTime) / 1000))
  if (day >= 2) {
    return parseInt(day) + "天前"
  } else if (day > 0 && day < 2) {
    return "昨天"
  } else if (hour > 0 && hour < 24) {
    return parseInt(hour) + "小时前"
  } else if (minutes > 0 && minutes < 60) {
    return parseInt(minutes) + "分钟前"
  } else if (seconds > 0 && seconds < 60) {
    return parseInt(seconds) + "秒前"
  }
}

function menuChanged(index) {
  //newsRawData = []
  newsType = menuIndex[index]
  getData(newsType, null, function(rawdata) {
    newsRawData = rawdata
    $("newsList").data = formateData(newsRawData)
    $("newsList").scrollTo({
      indexPath: $indexPath(0, 0),
      animated: true
    })
  })
}

function getTimeStamp(str) {
  var time = new Date(str)
  return time.getTime()
}

function formateData(rawdata) {
  var data = rawdata.map(item => {
    return {
      newsTitle: {
        text: item.title
      },
      newsSummary: {
        text: item.summaryAuto
      },
      newsLink: item.mobileUrl,
      newsSite: {
        text: item.siteName
      },
      newsTime: {
        text: timeAgo(getTimeStamp(item.publishDate))
      }
    }
  })
  return data
}

function getData(newsType, lastCursor, callback) {
  if (!lastCursor) lastCursor = "";
  $ui.loading(true)
  $http.get({
    url: `https://api.readhub.me/${newsType}?lastCursor=${lastCursor}&pageSize=20`,
    handler: function(resp) {
      $ui.loading(false)
      $("newsList").endRefreshing()
      var data = resp.data
      if (data) {
        typeof(callback) === "function" ? callback(data.data): false
      } else {
        $ui.toast("网络错误")
      }
    }
  })
}

function renderMain() {
  $ui.render({
    props: {
      title: "ReadHub"
    },
    views: [{
      type: "view",
      props: {
        id: ""
      },
      views: [nav, newsList],
      layout: $layout.fill,
      events: {

      }
    }]
  })
  getData(newsType, null, function(rawdata) {
    newsRawData = rawdata
    $("newsList").data = formateData(newsRawData)
  })
}

function checkUpdate() {
  $http.get({
    url: "https://raw.githubusercontent.com/gadzan/readhub/master/version.json",
    handler: function(resp) {
      var newVersion = resp.data.version;
      var msg = resp.data.msg;
      if (newVersion > version) {
        $ui.alert({
          title: "最新版本为 " + newVersion,
          message: "更新后自动会关闭本扩展,重新打开本扩展即可.\n" + msg,
          actions: [{
            title: "更新",
            handler: function() {
              var url = "jsbox://install?url=https://raw.githubusercontent.com/gadzan/readhub/master/readhub.js&name=ReadHub&icon=icon_050.png";
              $app.openURL(encodeURI(url));
              $app.close()
            }
          }, {
            title: "取消"
          }]
        })
      }
    }
  })
}

renderMain()
