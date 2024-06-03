import React, {useState, useEffect} from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth'
import { auth } from '../FirebaseConfig';


export const Login = () => {

  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const location = useLocation();
  const { search } = location;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [initialLoading, setInitialLoading] = useState(false);
  const [initialError, setInitialError] = useState('');

  useEffect(() => {
    if (user) {
      if (user.emailVerified) {
        navigate('/');
      } else {
        navigate('/verify-email');
      }
    } else {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = localStorage.getItem('email');
        if (!email) {
          email = window.prompt('Please provide your email');
        }
        setInitialLoading(true);
        signInWithEmailLink(auth, email, window.location.href)
          .then((result) => {
            localStorage.removeItem('email');
            setInitialLoading(false);
            setInitialError('');
            if (result.user.emailVerified) {
              navigate('/');
            } else {
              navigate('/verify-email');
            }
          })
          .catch((err) => {
            setInitialLoading(false);
            setInitialError(err.message);
            navigate('/login');
          });
      }
    }
  }, [user, search, navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        setLoginLoading(false);
        setLoginError('');
      })
      .catch((err) => {
        setLoginLoading(false);
        setLoginError(err.message);
      });
  };

  const handleSendLink = () => {
    setLoginLoading(true);
    sendSignInLinkToEmail(auth, email, {
      url: 'http://localhost:3000/login',
      handleCodeInApp: true,
    })
      .then(() => {
        localStorage.setItem('email', email);
        setLoginLoading(false);
        setLoginError('');
        setInfoMsg('We have sent you an email with a link to sign in');
      })
      .catch((err) => {
        setLoginLoading(false);
        setLoginError(err.message);
      });
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    setLoginLoading(true);
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        sendEmailVerification(user, {
          url: 'http://localhost:3000',
          handleCodeInApp: true,
        }).then(() => {
          
          setLoginLoading(false);
          setInfoMsg('Verification email sent. Please check your inbox.');
        });
      })
      .catch((err) => {
        setLoginLoading(false);
        setLoginError(err.message);
      });
  };

  return (
    <div className='box'>
      {initialLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          {initialError !== '' ? (
            <div className='error-msg'>{initialError}</div>
          ) : (
            <>
              {user ? (
                <div>Please wait...</div>
              ) : (
                <form className='form-group custom-form' onSubmit={handleLogin}>
                  <label>Email</label>
                  <input
                    type='email'
                    required
                    placeholder='Enter Email'
                    className='form-control'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <label>Password</label>
                  <input
                    type='password'
                    required
                    placeholder='Enter Password'
                    className='form-control'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type='submit' className='btn btn-success btn-md'>
                    {loginLoading ? <span>Logging you in</span> : <span>Login</span>}
                  </button>
                  <button type='button' className='btn btn-link' onClick={handleSendLink}>
                    Send Sign-In Link
                  </button>
                  <button type='button' className='btn btn-primary btn-md' onClick={handleSignUp}>
                    {loginLoading ? <span>Signing you up</span> : <span>Sign Up</span>}
                  </button>
                  {loginError !== '' && <div className='error-msg'>{loginError}</div>}
                  {infoMsg !== '' && <div className='info-msg'>{infoMsg}</div>}
                </form>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
