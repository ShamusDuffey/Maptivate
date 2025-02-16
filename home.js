SUPABASE_URL = 'https://tckolgmxbedfuytfkudh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRja29sZ214YmVkZnV5dGZrdWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MjY3MjMsImV4cCI6MjA1MDUwMjcyM30.FEemUUeRDJwT8s98mY2sZa0xwlh72EJQlzO7Kxa2uIA';
const sb = supabase.createClient(SUPABASE_URL, supabaseKey);

createNewLayer.addEventListener('click', async() =>
{
	const { count, error: countError } = await supabase
        .from('Layers')
        .select('*', { count: 'exact', head: true });

    	if (countError)
	{
        	console.error('Error fetching count:', countError);
        	alert('Error fetching count: ' + countError.message);
        	return;
    	}
	const {data, error} = await supabase.from('Layers').insert([{layer_id: count, name: "Shamus"}]);
	if (error)
	{
        	console.error('Error inserting data:', error);
        	alert('Error inserting data: ' + error.message);
      	}
	else
	{
        	console.log('Data inserted successfully:', data);
        	alert('Data inserted successfully!');
      	}
}

