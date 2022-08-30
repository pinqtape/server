


const scriptsInEvents = {

		async Game_sheet_Event3(runtime, localVars)
		{
			globalThis.addEventListener("keydown", e => {
				if (e.code === "Tab")
				{
					e.preventDefault();
				}
			});
		},

		async Menu_sheet_Event21(runtime, localVars)
		{
			
			function keypress(event)
			{
				const list = "1234567890";
				return (list.indexOf(String.fromCharCode(event.keyCode)) != -1);
			}
			
			const objects = runtime.objects.TextInput.getAllInstances();
			if (objects.length > 1)
			{
				for (let i = 0; i < objects.length; i++) CheckNumberBox[i].onkeypress = event => keypress(event);
				return;
			}
			CheckNumberBox.onkeypress = event => keypress(event);
		}

};

self.C3.ScriptsInEvents = scriptsInEvents;

