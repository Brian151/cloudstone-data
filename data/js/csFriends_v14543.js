var notInstalledUsers = new Array();
	
function randOrd()
{
	return (Math.round(Math.random())-0.5);
}

function selectAll(checked)
{
	if(checked)
	{
		var temp = notInstalledUsers;
		temp.sort( randOrd );
		for(var i=0; i < temp.length; i++)
		{
			if(i >= 50)
			{
				break;
			}
			selectCheckbox(temp[i].id, temp[i].name);
		}
		// Clear select users
		showUsers("ZXXZYXXYZXY");
	}
	else
	{
		$('.deleteSelectedUser').each(function() { $(this).click(); });
		showUsers("");
	}
}

function deleteCheckbox(id)
{
	$('#userSelect_' + id).show();
	$('#userSelected_' + id).remove();
}

function selectCheckbox(id, name)
{
	$('#userSelect_' + id).hide();
	$("#selected").append("<li id='userSelected_" + id + "'><input type=hidden class='selectedUsersForInvites' value='" + id + "'/><span class='deleteSelectedUser' onclick=\"deleteCheckbox('" + id + "');\"></span>" + name + "</li>");
}

function sortByName(a, b) {
	var x = a.name.toLowerCase();
	var y = b.name.toLowerCase();
	return ((x < y) ? -1 : ((x > y) ? 1 : 0));
}

function loadFriends()
{	
	authenticate();
	FB.api('/me/friends?fields=installed,name',  
		function(response) {
			if (!response || response.error) 
			{
				alert('Error occured ' + response.error.message);
			} else 
			{
				//var notInstalledUsers = new Array();
				for(var i=0; i < response.data.length; i++)
				{
					if(!response.data[i].installed)
					{ 
						notInstalledUsers.push({"id":response.data[i].id, "name":response.data[i].name});
					}
				}
				notInstalledUsers.sort(sortByName);
				//notInstalledUsers.sort( randOrd );
				for(var i=0; i < notInstalledUsers.length; i++)
				{
					if(i >= 50)
					{
						//break;
					}
					$("#apple").append("<li id='userSelect_" + notInstalledUsers[i].id + "'><input type=checkbox class=selectCheckbox onclick=\"selectCheckbox('" + notInstalledUsers[i].id + "', '" + notInstalledUsers[i].name + "'); return false;\" />" + notInstalledUsers[i].name + "</li>");
				}
			}
		}
	);		
	$("#loadingIndicator").hide();
	$("#friendsInviteWindow").show();
}

function showUsers(searchText)
{
	for(var i=0; i < notInstalledUsers.length; i++)
	{
		if(notInstalledUsers[i].name.search(new RegExp(searchText, "i")) >= 0 || searchText == '')
		{
			$('#userSelect_' + notInstalledUsers[i].id).show();
		}
		else
		{
			$('#userSelect_' + notInstalledUsers[i].id).hide();
		}
	}
}

$('#searchBox').keyup(function()
{
	showUsers($(this).val());
});

loadFriends();