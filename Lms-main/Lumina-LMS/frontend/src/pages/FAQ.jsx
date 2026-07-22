import React from 'react';

export default function FAQ(){
  const faqs = [
    { q: 'How do I enroll in a course?', a: 'Open Courses, choose a course, then click Enroll.' },
    { q: 'Where can I see my assignments?', a: 'Use the My assignments page from the menu.' },
    { q: 'How to see my grades?', a: 'Open My grades from the profile menu or the navigation.' },
    { q: 'I forgot my password. What do I do?', a: 'Use Forgot Password on the login page to reset.' },
  ];

  const [open, setOpen] = React.useState({}); // index -> boolean
  const toggle = (idx) => setOpen(o => ({ ...o, [idx]: !o[idx] }));

  return (
    <div className="container" style={{padding:16}}>
      <div className="page-watermark" style={{ backgroundImage: 'url(/logo-lms.svg)' }} />
      <div className="card" style={{maxWidth:900, margin:'24px auto'}}>
        <h2 style={{marginTop:0}}>Frequently Asked Questions</h2>
        <div className="list" style={{marginTop:12}}>
          {faqs.map((f, i) => (
            <div key={i} className="card" style={{padding:'14px 16px'}}>
              <button
                onClick={()=>toggle(i)}
                className="btn ghost"
                style={{
                  width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:0, border:'none', background:'transparent', cursor:'pointer'
                }}
                aria-expanded={!!open[i]}
                aria-controls={`faq-ans-${i}`}
              >
                <span style={{fontWeight:600, textAlign:'left'}}>{f.q}</span>
                <span style={{transition:'transform .2s', transform: open[i] ? 'rotate(180deg)' : 'rotate(0deg)'}}>▾</span>
              </button>
              {open[i] && (
                <div id={`faq-ans-${i}`} className="muted" style={{marginTop:8}}>{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
