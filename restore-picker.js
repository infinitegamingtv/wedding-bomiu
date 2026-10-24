const fs = require('fs');
let c = fs.readFileSync('src/components/InvitationUI.js', 'utf8');

const newPicker = `
        <div className={styles.eventPickerContainer}>
          <h2 className={styles.pickerTitle}>Bạn sẽ chung vui cùng chúng mình tại đâu?</h2>
          <div className={styles.eventPicker} role="group" aria-label="Chọn tiệc cưới">
            {events.map(event => {
              const mainDate = weddingDate(event.date);
              const subDate = event.subEvents?.[0] ? weddingDate(event.subEvents[0].date) : null;
              const dateToShow = Number.isFinite(mainDate.getTime()) ? mainDate : (Number.isFinite(subDate?.getTime()) ? subDate : null);
              return (
                <button key={event.id} className={event.id === selectedEvent.id ? styles.primaryButton : styles.secondaryButton} aria-pressed={event.id === selectedEvent.id} onClick={() => { setActiveTabId(event.id); if (!rsvpSelectionEdited.current) setForm(previous => ({ ...previous, eventIds: [event.id] })); if (hasReply) setStatus('idle'); }}>
                  <strong>{event.name}</strong>
                  {dateToShow && <small>{formatDate(dateToShow)}</small>}
                </button>
              );
            })}
          </div>
        </div>
`;

c = c.replace(/(<FadeInSection id="invite">)/, `$1\n${newPicker}`);

fs.writeFileSync('src/components/InvitationUI.js', c, 'utf8');
console.log('Restored picker');
