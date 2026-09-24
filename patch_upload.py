import re

with open('src/components/dashboard/GestaoCadastros.tsx', 'r') as f:
    text = f.read()

# The block to replace
old_block = r"""                  <input 
                    type="file" 
                    accept="image/\*" 
                    onChange=\{handleImageChange\}
                    className="text-xs text-slate-500 file:mr-3 file:py-1\.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                  />
                  <p className="text-\[11px\] text-slate-400 mt-1">Otimizada automaticamente para menos de 200 KB\.</p>"""

new_block = r"""                  <div>
                    <label className="cursor-pointer inline-block py-1.5 px-4 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm mt-1">
                      Escolher arquivo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>"""

text = re.sub(old_block, new_block, text)

with open('src/components/dashboard/GestaoCadastros.tsx', 'w') as f:
    f.write(text)
