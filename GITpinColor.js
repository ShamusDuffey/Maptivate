const colorToPinIcon=
{
	'red': 'redPin.png',
	'blue': 'bluePin.png',
	'yellow': 'yellowPin.png',
	'white': 'whitePin.png',
	'purple': 'purplePin.png',
	'orange': 'orangePin.png',
	'green': 'greenPin.png',
	'brown': 'brownPin.png',
	'black': 'blackPin.png',
	'pink': 'lightRedPin.png',
	'#ffb77d': 'lightOrangePin.png',
	'#96ff96': 'lightGreenPin.png',
	'#d132d1': 'lightPurplePin.png',
	'#8787ff': 'lightBluePin.png'
};
function getPinColor(workingIndex, selected_layer_ids)
{
	let pinColor;
	switch(workingIndex)
	{
		case 0:
			pinColor="red";
			if(selected_layer_ids[1]&&selected_layer_ids[2]&&selected_layer_ids[3])
				pinColor="black";
			else if(selected_layer_ids[1]&&selected_layer_ids[2])
				pinColor="brown";
			else if(selected_layer_ids[2]&&selected_layer_ids[3])
				pinColor="#ffb77d";//light orange
			else if(selected_layer_ids[1]&&selected_layer_ids[3])
				pinColor="#d132d1";//light purple
			else if(selected_layer_ids[1])
				pinColor="purple";
			else if(selected_layer_ids[2])
				pinColor="orange";
			else if(selected_layer_ids[3])
				pinColor="pink";
			break;
		case 1:
			pinColor="blue";
			if(selected_layer_ids[0]&&selected_layer_ids[2]&&selected_layer_ids[3])
				pinColor="black";
			else if(selected_layer_ids[0]&&selected_layer_ids[2])
				pinColor="brown";
			else if(selected_layer_ids[2]&&selected_layer_ids[3])
				pinColor="#96ff96";//light green
			else if(selected_layer_ids[0]&&selected_layer_ids[3])
				pinColor="#d132d1";//light purple
			else if(selected_layer_ids[0])
				pinColor="purple";
			else if(selected_layer_ids[2])
				pinColor="green";
			else if(selected_layer_ids[3])
				pinColor="#8787ff";//light blue
			break;
		case 2:
			pinColor="yellow";
			if(selected_layer_ids[0]&&selected_layer_ids[1]&&selected_layer_ids[3])
				pinColor="black";
			else if(selected_layer_ids[0]&&selected_layer_ids[1])
				pinColor="brown";
			else if(selected_layer_ids[1]&&selected_layer_ids[3])
				pinColor="#96ff96";//light green
			else if(selected_layer_ids[0]&&selected_layer_ids[3])
				pinColor="#ffb77d";//light orange
			else if(selected_layer_ids[0])
				pinColor="orange";
			else if(selected_layer_ids[1])
				pinColor="green";
			else if(selected_layer_ids[3])
				pinColor="#d132d1";//light yellow
			break;
		case 3:
			pinColor="white";
			if(selected_layer_ids[0]&&selected_layer_ids[1]&&selected_layer_ids[2])
				pinColor="black";
			else if(selected_layer_ids[0]&&selected_layer_ids[1])
				pinColor="#d132d1";//light purple
			else if(selected_layer_ids[1]&&selected_layer_ids[2])
				pinColor="#96ff96";//light green
			else if(selected_layer_ids[0]&&selected_layer_ids[2])
				pinColor="#ffb77d";//light orange
			else if(selected_layer_ids[0])
				pinColor="pink";
			else if(selected_layer_ids[1])
				pinColor="#8787ff";//light blue
			else if(selected_layer_ids[2])
				pinColor="#d132d1";//light yellow
			break;
		default:
			return null;
	}
	return pinColor;
}
