// friendFeedBadge by Robert Nyman, http://www.robertnyman.com/, http://code.google.com/p/friendfeedbadge/
// adapted by Barijaona Ramaholimihaso (local timezone, services behaviour)
var friendFeedBadge = function () {
	// User settings
	var settings = {
		userName : "barijaona", // Your Friendfeed user name
		itemsToShow : 20, // Number of Friendfreed items to retrieve
		itemToAddBadgeTo : "friendfeed-badge", // Id of HTML element to put badge code into
		imageSize : 100, // Suggested values: 75, 100, 250, 400 or 500
		showServiceIcons : false, // Apply icons for each service from Friendfeed. Each list item get a service class name, for custom CSS styling
		timeToWait : 20000 // Milliseconds, 1000 = 1 second
	};
	
	// Script element creation
	var head = document.getElementsByTagName("head")[0];
	var badgeContainer = document.getElementById(settings.itemToAddBadgeTo);
	if (head && badgeContainer) {
		var badgeJSON = document.createElement("script");
		badgeJSON.type = "text/javascript";
		badgeJSON.src = "http://friendfeed.com/api/feed/user/" + settings.userName + "?callback=friendFeedBadge.listItems&num=" + settings.itemsToShow;
		head.appendChild(badgeJSON);

		var wait = setTimeout(function () {
			friendFeedBadge.listItems = function () {};
			badgeJSON.parentNode.removeChild(badgeJSON);
			badgeJSON = null;
		}, settings.timeToWait);
	}
	
	return {
		// Badge functionality
		listItems : function (json) {
			var posts = json.entries;
			var list = document.createElement("ul"), 
				post, 
				listItem, 
				text, 
				link, 
				img, 
				postLink;
			list.className = "friendfeed";
			for (var i=0, il=posts.length; i<il; i=i+1) {
				post = posts[i];
				var publishedDate = post.published.match(/(\d{4})\-(\d{2})\-(\d{2})T(\d{2}):(\d{2})/);
				var now = new Date();
				var publication = {
					date : publishedDate[3],
					month : publishedDate[2] - 1,
					year : publishedDate[1],
					hours : publishedDate[4],
					minutes : publishedDate[5]
				};
				var published = new Date();
				published.setUTCDate(publication.date);
				published.setUTCMonth(publication.month);
				published.setUTCFullYear(publication.year);
				published.setUTCHours(publication.hours);
				published.setUTCMinutes(publication.minutes);
				
				var timeAgo = now - published;
				timeAgo = (timeAgo / 1000) / 60;
				var timeAgoText = "Il y a " + timeAgo + " minutes";
				if (timeAgo > 60) {
					timeAgo = parseInt(timeAgo / 60, 10);
					timeAgoText = "Il y a " + timeAgo + " heures";
				}
				if (timeAgo > 23) {
					var weekDays = [
						"Dimanche",
						"Lundi",
						"Mardi",
						"Mercredi",
						"Jeudi",
						"Vendredi",
						"Samedi",
					];
					exp1 = published.getHours();
					exp1 = ((exp1<10) ? "0"+exp1 : exp1);
					exp2 = published.getMinutes();
					exp2 = ((exp2<10) ? "0"+exp2 : exp2);
					exp3 = published.getMonth()+1;
					if (timeAgo < 168) {
						timeAgoText = weekDays[published.getDay()] + " à " + exp1 + ":" + exp2;
					}
					else {
						timeAgoText = weekDays[published.getDay()] + " " + published.getDate() + "/" + exp3 ;
					}
						
				}
				
				listItem = document.createElement("li");
				listItem.className = post.service.id;
				text = post.title;
				if (settings.showServiceIcons) {
					listItem.style.background = "url(" + post.service.iconUrl + ") no-repeat";
				}
				if (/twitter|internal|facebook/i.test(post.service.id)) {
					// Post published info
					postLink = document.createElement("a");
					postLink.className = "friendfeed-post-date";
					postLink.href = post.link;
					postLink.innerHTML = " " + timeAgoText;
					listItem.appendChild(postLink);
					//status
					listItem.innerHTML += " : " + text ;
				}
				else {
					listItem.innerHTML = timeAgoText + " : ";
					link = document.createElement("a");
					link.href = post.link;
					if (post.media.length > 0) {
						img = document.createElement("img");
						// To avoid a creeping page
						img.width = settings.imageSize;
						img.src = post.media[0].thumbnails[0].url;
						link.appendChild(img);
					}
					link.innerHTML += text;
					listItem.appendChild(link);
				}

				cl= post.comments.length;
//				if (cl > 0) {
					commentsList = document.createElement("ul");
					for (var j=0 ; j<cl; j=j+1) {
						commentsItem = document.createElement("li");
						comment = post.comments[j];
						commentsItem.innerHTML = comment.body + " (" + comment.user.nickname + ")" ;
						commentsList.appendChild(commentsItem);
					}
					commentsItem = document.createElement("li");
					link = document.createElement("a");
					link.href = "http://friendfeed.com/"+settings.userName + "/" + post.id.substring(0, post.id.indexOf("-"));
					link.innerHTML = "Réagir";
					commentsItem.appendChild(link);
					commentsList.appendChild(commentsItem);
				listItem.appendChild(commentsList);
//				}	
					
				

				// Apply list item to list
				list.appendChild(listItem);
			}

			// Apply list to container element
			//badgeContainer.innerHTML = "";
			badgeContainer.appendChild(list);
		}
	};	
}();