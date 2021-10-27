import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  const leftPad = { marginLeft: '15px' }
  return (
    <div className={styles.container}>
      <Head>
        <title>Edit multiple PDF pages</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">PDF to PDF</h1>

        <p className="description">
          Upload a PDF, describe a transformation, get a new PDF.
        </p>

        <form encType="multipart/form-data" action="/api/form" method="POST">
          <label htmlFor="#prefix">Prefixe:
            <input id="prefix" style={leftPad} type="text" name="prefix" placeholder="ULC"></input>
          </label>
          <br />
          <br />
          <label htmlFor="#project">Project:
            <input id="project" style={leftPad} type="text" name="project" placeholder="Numéro de projet"></input>
          </label>
          <br />
          <br />
          <label htmlFor="#pdf">PDF:
            <input style={leftPad} id="pdf" type="file" name="pdf" accept=".pdf"></input>
          </label>

          <br />
          <br />
          <label htmlFor="#csv">CSV:
            <input style={leftPad} id="csv" type="file" name="csv" accept=".csv"></input>
          </label>

          <br />
          <br />
          <label htmlFor="#delimiter">Separateur:
            <select style={leftPad} id="delimiter" name="delimiter" defaultValue=";">
              <option value=";">;</option>
              <option value=",">,</option>
            </select>
          </label>

          <br />
          <br />
          <button type="submit">Soumettre</button>
        </form>
      </main>

      <footer>
        <a href="https://zeit.co" target="_blank" rel="noopener noreferrer">
          Powered by <img src="/zeit.svg" alt="ZEIT Logo" />
        </a>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        footer img {
          margin-left: 0.5rem;
        }

        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .title a {
          color: #0070f3;
          text-decoration: none;
        }

        .title a:hover,
        .title a:focus,
        .title a:active {
          text-decoration: underline;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
        }

        .title,
        .description {
          text-align: center;
        }

        .description {
          line-height: 1.5;
          font-size: 1.5rem;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}

export default Home
