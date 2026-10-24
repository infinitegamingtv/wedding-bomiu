const fs = require('fs');
let c = fs.readFileSync('src/app/admin/page.js', 'utf8');

// 1. Add new state variables
c = c.replace(/const \[data, setData\] = useState\(null\);/, `const [data, setData] = useState(null);
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);`);

// 2. Update useEffect
const oldUseEffect = `    useEffect(() => {
      let active = true;
      fetch('/api/auth').then(res => res.json()).then(async session => {
        if (!session.authenticated) return;
        const res = await fetch('/api/data');
        if (!res.ok) throw new Error('Khng t?i du?c d? li?u.');
        const value = await res.json();
        if (active) {
          setData(value);
          setOriginalData(JSON.stringify(value));
          setLoading(false);
        }
      }).catch(err => {
        if (active) { setNotice(err.message); setLoading(false); }
      });
      return () => { active = false; };
    }, []);`;

const newUseEffect = `    useEffect(() => {
      let active = true;
      fetch('/api/auth').then(res => res.json()).then(async session => {
        if (!session.authenticated) {
            if (active) { setAuth(false); setLoading(false); }
            return;
        }
        const dataRes = await fetch('/api/data');
        if (!dataRes.ok) throw new Error('Không tải được dữ liệu.');
        const value = await dataRes.json();
        if (active) {
          setData(value);
          setOriginalData(JSON.stringify(value));
          setAuth(true);
          setLoading(false);
        }
      }).catch(err => {
        if (active) { setNotice(err.message); setLoading(false); }
      });
      return () => { active = false; };
    }, []);`;

// we need regex to match because of encoding
const useEffectRegex = /useEffect\(\(\) => \{\s*let active = true;\s*fetch\('\/api\/auth'\)\.then\(res => res\.json\(\)\)\.then\(async session => \{\s*if \(!session\.authenticated\) return;\s*const res = await fetch\('\/api\/data'\);\s*if \(!res\.ok\) throw new Error\([^)]+\);\s*const value = await res\.json\(\);\s*if \(active\) \{\s*setData\(value\);\s*setOriginalData\(JSON\.stringify\(value\)\);\s*setLoading\(false\);\s*\}\s*\}\)\.catch\(err => \{\s*if \(active\) \{ setNotice\(err\.message\); setLoading\(false\); \}\s*\}\);\s*return \(\) => \{ active = false; \};\s*\}, \[\]\);/;

c = c.replace(useEffectRegex, newUseEffect);

// 3. Update logout and add handleLogin
const oldLogout = `const logout = () => { document.cookie = 'auth=; Max-Age=0; path=/'; window.location.href = '/admin/login'; };`;
const newLogout = `
    const handleLogin = async e => {
      e.preventDefault(); setLoginBusy(true); setNotice('');
      try {
        const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Không đăng nhập được.');
        const dataResponse = await fetch('/api/data');
        if (!dataResponse.ok) throw new Error('Không tải được dữ liệu.');
        const fetchedData = await dataResponse.json();
        setData(fetchedData); setOriginalData(JSON.stringify(fetchedData)); setPassword(''); setAuth(true); setLoading(false);
      } catch (err) { setNotice(err.message); }
      finally { setLoginBusy(false); }
    };

    const logout = async () => {
      try {
        const res = await fetch('/api/auth', { method: 'DELETE' });
        if (!res.ok) throw new Error('Chưa đăng xuất được.');
        setAuth(false); setData(null); setNotice('');
      } catch (err) { setNotice(err.message); }
    };
`;
c = c.replace(oldLogout, newLogout);

// 4. Add the login UI block
const oldError = `if (!data) return <div style={{padding: '50px', textAlign: 'center'}}>L?i t?i d? li?u. <button \n onClick={logout}>Dang nh?p l?i</button></div>;`;

// wait, the previous code is: 
// if (!data) return <div style={{padding: '50px', textAlign: 'center'}}>L?i t?i d? li?u. <button \n onClick={logout}>Dang nh?p l?i</button></div>;
// using regex
const errorRegex = /if \(!data\) return <div style=\{\{padding: '50px', textAlign: 'center'\}\}>[^<]+<button onClick=\{logout\}>[^<]+<\/button><\/div>;/;

const loginUI = `if (!auth) {
      return (
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f5f5'}}>
          <form onSubmit={handleLogin} style={{background: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%', textAlign: 'center'}}>
            <h2 style={{marginBottom: '20px', color: '#333'}}>Đăng nhập Quản trị</h2>
            <div style={{marginBottom: '15px', textAlign: 'left'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: 600}}>Mật khẩu</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}} required />
            </div>
            <button type="submit" disabled={loginBusy} style={{width: '100%', padding: '12px', background: '#000', color: '#fff', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}>
              {loginBusy ? 'Đang kiểm tra...' : 'Đăng nhập'}
            </button>
            {notice && <p style={{color: 'red', marginTop: '16px'}}>{notice}</p>}
          </form>
        </div>
      );
    }
    
    if (!data) return <div style={{padding: '50px', textAlign: 'center'}}>Lỗi tải dữ liệu. <button onClick={logout}>Đăng xuất / Tải lại</button></div>;
`;

c = c.replace(errorRegex, loginUI);

fs.writeFileSync('src/app/admin/page.js', c, 'utf8');
console.log("Restored auth logic.");
