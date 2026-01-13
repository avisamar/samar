import { HttpLink } from '@apollo/client';
import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client';
import { setContext, SetContextLink } from '@apollo/client/link/context';
import dotenv from 'dotenv';

dotenv.config();

const GENERATE_API_KEY_TOKEN = gql`
  mutation GenerateApiKeyToken($apiKeyId: UUID!, $expiresAt: String!) {
    generateApiKeyToken(apiKeyId: $apiKeyId, expiresAt: $expiresAt) {
      token
      __typename
    }
  }
`;

async function main() {
  console.log('Starting API Keys...');
  const apiKeyId = '0b46ea82-c96f-4181-b293-945c2d6cc19d';
  const expiresAt = '2125-11-17T09:03:29.850Z';
  
  // const baseURL = process.env.TWENTY_API_URL?.replace('rest', 'graphql') || 'http://localhost:3000';
  const token = process.env.TWENTY_API_TOKEN;

  if (!token) {
    console.error('Error: TWENTY_API_TOKEN is not set in environment variables.');
    return;
  }

  const httpLink = new HttpLink({
    uri: `http://localhost:3000/graphql`,
  });

  const authLink = new SetContextLink((prevContext, operation) => {
    return {
      headers: {
        ...prevContext.headers,
        'Authorization': `Bearer ${token}`,
      },
    };
  });

  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });

  try {
    const { data } = await client.mutate<{
      generateApiKeyToken: {
        token: string;
        __typename: string;
      };
    }>({
      mutation: GENERATE_API_KEY_TOKEN,
      variables: {
        apiKeyId,
        expiresAt,
      },
    });

    console.log('✅ Generated API Key Token:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data?.generateApiKeyToken?.token) {
      console.log(`\nToken: ${data.generateApiKeyToken.token}`);
    }
  } catch (error: any) {
    console.error('❌ Failed to generate API Key Token:');
    if (error.networkError) {
      console.error('Network Error:', error.networkError.message);
      if (error.networkError.result) {
        console.error('Result:', JSON.stringify(error.networkError.result, null, 2));
      }
    } else if (error.graphQLErrors) {
      console.error('GraphQL Errors:', JSON.stringify(error.graphQLErrors, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }

  // for (let i = 5000; i < 5001; i++) {
  //   const payload = {
  //     name: `API Key ${i}`,
  //     expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  //     roleId: '449e49ba-be6b-46c6-a721-b0b5921a6c69'
  //   }

  //   try {
  //     const { data: created } = await apiClient.post('metadata/apiKeys', payload);
  //     console.log(JSON.stringify(created, null, 2));
  //     // console.log(`✅ Created API Key ${i}`);
  //   } catch (error: any) {
  //     console.error(`❌ Failed to create API Key ${i}:`, error.response?.data || error.message);
  //   }
  // }
}

main();