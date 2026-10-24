const fs = require('fs');

let content = fs.readFileSync('src/components/InvitationUI.js', 'utf8');

// 1. Add confetti import
if (!content.includes("import confetti from 'canvas-confetti';")) {
  content = "import confetti from 'canvas-confetti';\n" + content;
  console.log('1. Added confetti import');
}

// 2. Trigger golden confetti when RSVP is successful
const oldSubmitSuccess = `setNewWish(result.wish); setHasReply(true); setReplyError('');
      setStatus('success');`;

const newSubmitSuccess = `setNewWish(result.wish); setHasReply(true); setReplyError('');
      setStatus('success');
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#C5A880', '#e6cca0', '#ffd700', '#ffffff', '#79603d']
        });
      } catch (e) {}`;

if (content.includes(oldSubmitSuccess)) {
  content = content.replace(oldSubmitSuccess, newSubmitSuccess);
  console.log('2. Added confetti trigger on RSVP success');
}

// 3. Smart Countdown: change message when time is up or wedding day
const oldCountdown = `const Countdown = ({ date }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  useEffect(() => {
    const target = new Date(date).getTime();
    const update = () => {
      const diff = target - new Date().getTime();
      if (diff <= 0) return setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000)
      });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [date]);
  if (!timeLeft || (timeLeft.d === 0 && timeLeft.h === 0 && timeLeft.m === 0 && timeLeft.s === 0)) return null;
  return (
    <div className={styles.countdown}>
      <div className={styles.cdBox}><strong>{timeLeft.d}</strong><span>Ngày</span></div>
      <div className={styles.cdBox}><strong>{timeLeft.h}</strong><span>Giờ</span></div>
      <div className={styles.cdBox}><strong>{timeLeft.m}</strong><span>Phút</span></div>
      <div className={styles.cdBox}><strong>{timeLeft.s}</strong><span>Giây</span></div>
    </div>
  );
};`;

const newCountdown = `const Countdown = ({ date }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isHappening, setIsHappening] = useState(false);
  useEffect(() => {
    const target = new Date(date).getTime();
    const update = () => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) {
        // If within 24 hours of target date, show "Hôm nay là ngày vui!"
        if (Math.abs(diff) < 86400000) {
          setIsHappening(true);
        }
        return setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      }
      setIsHappening(false);
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000)
      });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [date]);
  if (isHappening) {
    return (
      <div style={{ margin: '14px 0', padding: '10px 20px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '30px', backdropFilter: 'blur(8px)', color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
        ✨ Hôm nay là ngày vui của chúng mình! ✨
      </div>
    );
  }
  if (!timeLeft || (timeLeft.d === 0 && timeLeft.h === 0 && timeLeft.m === 0 && timeLeft.s === 0)) return null;
  return (
    <div className={styles.countdown}>
      <div className={styles.cdBox}><strong>{timeLeft.d}</strong><span>Ngày</span></div>
      <div className={styles.cdBox}><strong>{timeLeft.h}</strong><span>Giờ</span></div>
      <div className={styles.cdBox}><strong>{timeLeft.m}</strong><span>Phút</span></div>
      <div className={styles.cdBox}><strong>{timeLeft.s}</strong><span>Giây</span></div>
    </div>
  );
};`;

if (content.includes(oldCountdown)) {
  content = content.replace(oldCountdown, newCountdown);
  console.log('3. Upgraded Countdown to Smart Countdown');
} else {
  console.log('Old countdown not matched directly, checking normalized line endings');
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const normalizedOld = oldCountdown.replace(/\r\n/g, '\n');
  if (normalizedContent.includes(normalizedOld)) {
    content = normalizedContent.replace(normalizedOld, newCountdown);
    console.log('3. Upgraded Countdown (normalized)');
  }
}

fs.writeFileSync('src/components/InvitationUI.js', content, 'utf8');
console.log('InvitationUI.js updated with confetti & smart countdown!');
